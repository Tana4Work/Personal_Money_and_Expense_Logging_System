import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import { AccountSubtype, AccountType, AllocationType, Prisma, TransactionFormType, UserRole } from "@prisma/client";
import { clearSession, createSession, currentUser, endUserSessions, hashPassword, readBearerToken, safeUser, verifyPassword, type SafeUser } from "./auth.js";
import { seedAccountsForUser } from "./account-seed.js";
import { getPrisma } from "./prisma.js";

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
}

async function requireAdministrator(req: Request, res: Response): Promise<SafeUser | null> {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return null; }
  if (user.role !== UserRole.ADMINISTRATOR) { res.status(403).json({ error: "Administrator access is required." }); return null; }
  return user;
}

async function requireUser(req: Request, res: Response): Promise<SafeUser | null> {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return null; }
  if (user.role !== UserRole.USER) { res.status(403).json({ error: "User access is required." }); return null; }
  return user;
}

function accountResponse(account: { id: number; name: string; type: string; subtype: string; openingBalance: { toString(): string }; openingBalanceDate: Date | null; createdAt: Date }) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    subtype: account.subtype,
    openingBalance: account.openingBalance.toString(),
    openingBalanceDate: account.openingBalanceDate?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  };
}

function transactionResponse(transaction: {
  id: number;
  formType: string;
  totalAmount: { toString(): string };
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  note: string | null;
  sourceAccount: { id: number; name: string; type: string; subtype: string } | null;
  receivingAccount: { id: number; name: string; type: string; subtype: string } | null;
  allocations: Array<{ id: number; allocationType: string; amount: { toString(): string }; account: { id: number; name: string; type: string; subtype: string } }>;
}) {
  return {
    id: transaction.id,
    formType: transaction.formType,
    totalAmount: transaction.totalAmount.toString(),
    transactionDate: transaction.transactionDate.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    note: transaction.note,
    sourceAccount: transaction.sourceAccount,
    receivingAccount: transaction.receivingAccount,
    allocations: transaction.allocations.map((line) => ({
      id: line.id,
      allocationType: line.allocationType,
      amount: line.amount.toString(),
      account: line.account,
    })),
  };
}

function parsePositiveAmount(rawAmount: unknown): Prisma.Decimal | null {
  if ((typeof rawAmount !== "string" && typeof rawAmount !== "number") || String(rawAmount).trim() === "") return null;
  try {
    const amount = new Prisma.Decimal(rawAmount);
    if (!amount.isFinite() || amount.isNegative() || amount.isZero() || amount.decimalPlaces() > 2 || amount.greaterThanOrEqualTo(new Prisma.Decimal(10).pow(35))) return null;
    return amount;
  } catch { return null; }
}

function parseOptionalNote(rawNote: unknown): { valid: boolean; value: string | null } {
  if (rawNote === undefined || rawNote === null) return { valid: true, value: null };
  if (typeof rawNote !== "string") return { valid: false, value: null };
  const note = rawNote.trim();
  if (note.length > 200) return { valid: false, value: null };
  return { valid: true, value: note || null };
}

function parseCalendarDate(rawDate: unknown): Date | null {
  if (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number(rawDate.slice(0, 4)) < 1) return null;
  const date = new Date(`${rawDate}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === rawDate ? date : null;
}

const transactionInclude = {
  sourceAccount: { select: { id: true, name: true, type: true, subtype: true } },
  receivingAccount: { select: { id: true, name: true, type: true, subtype: true } },
  allocations: { orderBy: { id: "asc" as const }, select: { id: true, allocationType: true, amount: true, account: { select: { id: true, name: true, type: true, subtype: true } } } },
};

type BalanceQueryClient = Pick<Prisma.TransactionClient, "account" | "transaction">;

export async function calculateAccountBalances(prisma: BalanceQueryClient, ownerUserId: number) {
  const accounts = await prisma.account.findMany({ where: { ownerUserId }, orderBy: [{ name: "asc" }, { id: "asc" }] });
  const transactions = await prisma.transaction.findMany({
    where: { ownerUserId },
    select: {
      formType: true,
      sourceAccountId: true,
      receivingAccountId: true,
      totalAmount: true,
      allocations: { select: { accountId: true, allocationType: true, amount: true } },
    },
  });
  const balances = new Map(accounts.map((account) => [account.id, new Prisma.Decimal(account.openingBalance)]));
  const changeBalance = (accountId: number, amount: Prisma.Decimal, add: boolean) => {
    const balance = balances.get(accountId);
    if (balance) balances.set(accountId, add ? balance.add(amount) : balance.sub(amount));
  };

  for (const transaction of transactions) {
    if (transaction.formType === TransactionFormType.RECEIVE_MONEY && transaction.receivingAccountId !== null) {
      changeBalance(transaction.receivingAccountId, transaction.totalAmount, true);
    }
    if (transaction.formType === TransactionFormType.PAYMENT_OR_CHARGE && transaction.sourceAccountId !== null) {
      changeBalance(transaction.sourceAccountId, transaction.totalAmount, false);
    }
    for (const line of transaction.allocations) {
      const addsBalance = transaction.formType === TransactionFormType.PAYMENT_OR_CHARGE
        && (line.allocationType === AllocationType.REPAYMENT || line.allocationType === AllocationType.LOAN_GIVEN || line.allocationType === AllocationType.TRANSFER);
      const subtractsBalance = transaction.formType === TransactionFormType.RECEIVE_MONEY
        && (line.allocationType === AllocationType.REPAYMENT || line.allocationType === AllocationType.BORROWING || line.allocationType === AllocationType.TRANSFER);
      if (addsBalance) changeBalance(line.accountId, line.amount, true);
      if (subtractsBalance) changeBalance(line.accountId, line.amount, false);
    }
  }

  return accounts.map((account) => ({
    accountId: account.id,
    balance: account.type === AccountType.INCOME || account.type === AccountType.EXPENSE
      ? "0"
      : balances.get(account.id)?.toString() ?? "0",
  }));
}

class CashOverdraftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashOverdraftError";
  }
}

async function assertCashBalancesNotNegative<T>(
  transaction: Prisma.TransactionClient,
  ownerUserId: number,
  cashAccountIds: number[],
  errorMessage: string,
  write: () => Promise<T>,
): Promise<T> {
  const accountIds = [...new Set(cashAccountIds)].sort((left, right) => left - right);
  if (accountIds.length > 0) {
    await transaction.$queryRaw<Array<{ id: number }>>(Prisma.sql`
      SELECT "id" FROM "Account"
      WHERE "ownerUserId" = ${ownerUserId}
        AND "type" = 'CASH'::"AccountType"
        AND "id" IN (${Prisma.join(accountIds)})
      ORDER BY "id" FOR UPDATE
    `);
  }

  const result = await write();
  const balances = await calculateAccountBalances(transaction, ownerUserId);
  const balanceById = new Map(balances.map((account) => [account.accountId, new Prisma.Decimal(account.balance)]));
  if (accountIds.some((accountId) => (balanceById.get(accountId)?.isNegative() ?? false))) {
    throw new CashOverdraftError(errorMessage);
  }
  return result;
}

app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "Personal Money API" }));

app.get("/api/ready", async (_req, res) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", db: "connected" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name) { res.status(400).json({ error: "Name is required." }); return; }
  if (!email) { res.status(400).json({ error: "Email is required." }); return; }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    res.status(400).json({ error: "Password must be at least 8 characters and include a capital letter and special character." }); return;
  }

  try {
    const user = await getPrisma().$transaction(async (transaction) => {
      const created = await transaction.user.create({ data: { name, email, passwordHash: await hashPassword(password), role: UserRole.USER, enabled: true } });
      await seedAccountsForUser(transaction, created.id);
      return created;
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "An account with that email already exists." }); return;
    }
    throw error;
  }
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.enabled || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." }); return;
  }
  const session = await createSession(user.id);
  res.status(200).json({ token: session.token, expiresAt: session.expiresAt.toISOString(), user: safeUser(user) });
}));

app.post("/api/auth/logout", asyncRoute(async (req, res) => {
  await clearSession(readBearerToken(req));
  res.status(204).send();
}));

app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return; }
  res.status(200).json({ user });
}));

app.get("/api/accounts", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const accounts = await getPrisma().account.findMany({
    where: { ownerUserId: user.id },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  res.status(200).json(accounts.map(accountResponse));
}));

app.get("/api/accounts/:accountId", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const accountId = Number(req.params.accountId);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    res.status(400).json({ error: "A valid account ID is required." }); return;
  }
  const account = await getPrisma().account.findUnique({ where: { id: accountId } });
  if (!account) { res.status(404).json({ error: "Account not found." }); return; }
  if (account.ownerUserId !== user.id) { res.status(403).json({ error: "Account access is not allowed." }); return; }
  res.status(200).json(accountResponse(account));
}));

app.post("/api/accounts/:accountId/opening-balance", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const accountId = Number(req.params.accountId);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    res.status(400).json({ error: "A valid account ID is required." }); return;
  }
  const prisma = getPrisma();
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) { res.status(404).json({ error: "Account not found." }); return; }
  if (account.ownerUserId !== user.id) { res.status(403).json({ error: "Account access is not allowed." }); return; }
  if (account.type !== AccountType.CASH || account.subtype !== AccountSubtype.BANK) {
    res.status(400).json({ error: "Opening balances can only be recorded for bank accounts." }); return;
  }

  const rawAmount = req.body?.amount;
  if ((typeof rawAmount !== "string" && typeof rawAmount !== "number") || String(rawAmount).trim() === "") {
    res.status(400).json({ error: "A valid non-negative amount is required." }); return;
  }
  let amount: Prisma.Decimal;
  try { amount = new Prisma.Decimal(rawAmount); }
  catch { res.status(400).json({ error: "A valid non-negative amount is required." }); return; }
  if (!amount.isFinite() || amount.isNegative() || amount.decimalPlaces() > 30 || amount.greaterThanOrEqualTo(new Prisma.Decimal(10).pow(35))) {
    res.status(400).json({ error: "A valid non-negative amount is required." }); return;
  }

  const rawDate = req.body?.date;
  if (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number(rawDate.slice(0, 4)) < 1) {
    res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return;
  }
  const openingBalanceDate = new Date(`${rawDate}T00:00:00.000Z`);
  if (!Number.isFinite(openingBalanceDate.getTime()) || openingBalanceDate.toISOString().slice(0, 10) !== rawDate) {
    res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return;
  }

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: { openingBalance: amount, openingBalanceDate },
  });
  res.status(200).json(accountResponse(updated));
}));

app.post("/api/transactions/receive", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const amount = parsePositiveAmount(req.body?.totalAmount);
  if (!amount) { res.status(400).json({ error: "A valid positive amount is required." }); return; }
  const transactionDate = parseCalendarDate(req.body?.date);
  if (!transactionDate) { res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return; }
  const note = parseOptionalNote(req.body?.note);
  if (!note.valid) { res.status(400).json({ error: "The note must be 200 characters or fewer." }); return; }
  const receivingAccountId = Number(req.body?.receivingAccountId);
  if (!Number.isInteger(receivingAccountId) || receivingAccountId <= 0) { res.status(400).json({ error: "A valid receiving account is required." }); return; }
  const allocations = req.body?.allocations;
  if (!Array.isArray(allocations) || allocations.length === 0) { res.status(400).json({ error: "At least one income allocation is required." }); return; }

  let allocationTotal = new Prisma.Decimal(0);
  const allocationData: Array<{ accountId: number; allocationType: AllocationType; amount: Prisma.Decimal }> = [];
  for (const item of allocations) {
    const accountId = Number(item?.accountId);
    const lineAmount = parsePositiveAmount(item?.amount);
    if (!Number.isInteger(accountId) || accountId <= 0 || !lineAmount || (item?.allocationType !== AllocationType.INCOME && item?.allocationType !== AllocationType.TRANSFER)) {
      res.status(400).json({ error: "Each allocation must be a positive income or transfer allocation." }); return;
    }
    allocationTotal = allocationTotal.add(lineAmount);
    allocationData.push({ accountId, allocationType: item.allocationType, amount: lineAmount });
  }
  if (!allocationTotal.equals(amount)) { res.status(400).json({ error: "Allocation total must equal the transaction total." }); return; }

  const prisma = getPrisma();
  const receivingAccount = await prisma.account.findUnique({ where: { id: receivingAccountId } });
  if (!receivingAccount) { res.status(404).json({ error: "Receiving account not found." }); return; }
  if (receivingAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Receiving account access is not allowed." }); return; }
  if (receivingAccount.type !== AccountType.CASH || (receivingAccount.subtype !== AccountSubtype.BANK && receivingAccount.subtype !== AccountSubtype.WALLET)) {
    res.status(400).json({ error: "Money can only be received into a cash or bank account." }); return;
  }

  const transferAccountIds: number[] = [];
  for (const line of allocationData) {
    const account = await prisma.account.findUnique({ where: { id: line.accountId } });
    if (!account) { res.status(404).json({ error: line.allocationType === AllocationType.INCOME ? "Income account not found." : "Transfer account not found." }); return; }
    if (account.ownerUserId !== user.id) { res.status(403).json({ error: "Allocation account access is not allowed." }); return; }
    if (line.allocationType === AllocationType.INCOME && account.type !== AccountType.INCOME) {
      res.status(400).json({ error: "Income allocations must use an income account." }); return;
    }
    if (line.allocationType === AllocationType.TRANSFER) {
      if (account.type !== AccountType.CASH || (account.subtype !== AccountSubtype.BANK && account.subtype !== AccountSubtype.WALLET)) {
        res.status(400).json({ error: "Transfers must use cash accounts." }); return;
      }
      if (account.id === receivingAccountId) { res.status(400).json({ error: "Transfer accounts must be different." }); return; }
      transferAccountIds.push(account.id);
    }
  }

  const createTransaction = () => prisma.transaction.create({
    data: {
      ownerUserId: user.id,
      formType: TransactionFormType.RECEIVE_MONEY,
      receivingAccountId,
      totalAmount: amount,
      transactionDate,
      note: note.value,
      allocations: { create: allocationData },
    },
    include: transactionInclude,
  });
  let transaction;
  try {
    transaction = transferAccountIds.length > 0
      ? await prisma.$transaction((databaseTransaction) => assertCashBalancesNotNegative(
        databaseTransaction, user.id, [receivingAccountId, ...transferAccountIds], "Insufficient balance in the source cash account.",
        () => databaseTransaction.transaction.create({
          data: {
            ownerUserId: user.id,
            formType: TransactionFormType.RECEIVE_MONEY,
            receivingAccountId,
            totalAmount: amount,
            transactionDate,
            note: note.value,
            allocations: { create: allocationData },
          },
          include: transactionInclude,
        }),
      ))
      : await createTransaction();
  } catch (error) {
    if (error instanceof CashOverdraftError) { res.status(400).json({ error: error.message }); return; }
    throw error;
  }
  res.status(201).json(transactionResponse(transaction));
}));

app.post("/api/transactions/payment", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const amount = parsePositiveAmount(req.body?.totalAmount);
  if (!amount) { res.status(400).json({ error: "A valid positive amount is required." }); return; }
  const transactionDate = parseCalendarDate(req.body?.date);
  if (!transactionDate) { res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return; }
  const note = parseOptionalNote(req.body?.note);
  if (!note.valid) { res.status(400).json({ error: "The note must be 200 characters or fewer." }); return; }
  const sourceAccountId = Number(req.body?.sourceAccountId);
  if (!Number.isInteger(sourceAccountId) || sourceAccountId <= 0) { res.status(400).json({ error: "A valid source account is required." }); return; }
  const allocations = req.body?.allocations;
  if (!Array.isArray(allocations) || allocations.length === 0) { res.status(400).json({ error: "At least one expense allocation is required." }); return; }

  let allocationTotal = new Prisma.Decimal(0);
  const allocationData: Array<{ accountId: number; allocationType: AllocationType; amount: Prisma.Decimal }> = [];
  for (const item of allocations) {
    const accountId = Number(item?.accountId);
    const lineAmount = parsePositiveAmount(item?.amount);
    if (!Number.isInteger(accountId) || accountId <= 0 || !lineAmount || (item?.allocationType !== AllocationType.EXPENSE && item?.allocationType !== AllocationType.TRANSFER)) {
      res.status(400).json({ error: "Each allocation must be a positive expense or transfer allocation." }); return;
    }
    allocationTotal = allocationTotal.add(lineAmount);
    allocationData.push({ accountId, allocationType: item.allocationType, amount: lineAmount });
  }
  if (!allocationTotal.equals(amount)) { res.status(400).json({ error: "Allocation total must equal the transaction total." }); return; }

  const prisma = getPrisma();
  const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
  if (!sourceAccount) { res.status(404).json({ error: "Source account not found." }); return; }
  if (sourceAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Source account access is not allowed." }); return; }
  const cashSource = sourceAccount.type === AccountType.CASH
    && (sourceAccount.subtype === AccountSubtype.BANK || sourceAccount.subtype === AccountSubtype.WALLET);
  const loanSource = sourceAccount.type === AccountType.LOAN_TAKEN
    && (sourceAccount.subtype === AccountSubtype.CREDIT_CARD || sourceAccount.subtype === AccountSubtype.OTHER);
  if (!cashSource && !loanSource) { res.status(400).json({ error: "Payments must use a cash or loan-taken account." }); return; }

  const transferAccountIds: number[] = [];
  for (const line of allocationData) {
    if (line.allocationType === AllocationType.TRANSFER && !cashSource) {
      res.status(400).json({ error: "Transfers must use cash accounts." }); return;
    }
    const account = await prisma.account.findUnique({ where: { id: line.accountId } });
    if (!account) { res.status(404).json({ error: line.allocationType === AllocationType.EXPENSE ? "Expense account not found." : "Transfer account not found." }); return; }
    if (account.ownerUserId !== user.id) { res.status(403).json({ error: "Allocation account access is not allowed." }); return; }
    if (line.allocationType === AllocationType.EXPENSE && account.type !== AccountType.EXPENSE) {
      res.status(400).json({ error: "Payment allocations must use expense accounts." }); return;
    }
    if (line.allocationType === AllocationType.TRANSFER) {
      if (account.type !== AccountType.CASH || (account.subtype !== AccountSubtype.BANK && account.subtype !== AccountSubtype.WALLET)) {
        res.status(400).json({ error: "Transfers must use cash accounts." }); return;
      }
      if (account.id === sourceAccountId) { res.status(400).json({ error: "Transfer accounts must be different." }); return; }
      transferAccountIds.push(account.id);
    }
  }

  const createTransaction = () => prisma.transaction.create({
    data: {
      ownerUserId: user.id,
      formType: TransactionFormType.PAYMENT_OR_CHARGE,
      sourceAccountId,
      totalAmount: amount,
      transactionDate,
      note: note.value,
      allocations: { create: allocationData },
    },
    include: transactionInclude,
  });
  let transaction;
  try {
    transaction = cashSource
      ? await prisma.$transaction((databaseTransaction) => assertCashBalancesNotNegative(
        databaseTransaction, user.id, [sourceAccountId, ...transferAccountIds], "Insufficient balance in the source cash account.",
        () => databaseTransaction.transaction.create({
          data: {
            ownerUserId: user.id,
            formType: TransactionFormType.PAYMENT_OR_CHARGE,
            sourceAccountId,
            totalAmount: amount,
            transactionDate,
            note: note.value,
            allocations: { create: allocationData },
          },
          include: transactionInclude,
        }),
      ))
      : await createTransaction();
  } catch (error) {
    if (error instanceof CashOverdraftError) { res.status(400).json({ error: error.message }); return; }
    throw error;
  }
  res.status(201).json(transactionResponse(transaction));
}));

app.post("/api/transactions/transfer", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const amount = parsePositiveAmount(req.body?.totalAmount);
  if (!amount) { res.status(400).json({ error: "A valid positive amount is required." }); return; }
  const transactionDate = parseCalendarDate(req.body?.date);
  if (!transactionDate) { res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return; }
  const note = parseOptionalNote(req.body?.note);
  if (!note.valid) { res.status(400).json({ error: "The note must be 200 characters or fewer." }); return; }
  const sourceAccountId = Number(req.body?.sourceAccountId);
  const receivingAccountId = Number(req.body?.receivingAccountId);
  if (!Number.isInteger(sourceAccountId) || sourceAccountId <= 0) { res.status(400).json({ error: "A valid source account is required." }); return; }
  if (!Number.isInteger(receivingAccountId) || receivingAccountId <= 0) { res.status(400).json({ error: "A valid receiving account is required." }); return; }

  const prisma = getPrisma();
  const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
  if (!sourceAccount) { res.status(404).json({ error: "Source account not found." }); return; }
  if (sourceAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Transfer account access is not allowed." }); return; }
  const receivingAccount = await prisma.account.findUnique({ where: { id: receivingAccountId } });
  if (!receivingAccount) { res.status(404).json({ error: "Receiving account not found." }); return; }
  if (receivingAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Transfer account access is not allowed." }); return; }
  if (sourceAccountId === receivingAccountId) { res.status(400).json({ error: "Transfer accounts must be different." }); return; }
  const isCashAccount = (account: typeof sourceAccount) => account.type === AccountType.CASH
    && (account.subtype === AccountSubtype.BANK || account.subtype === AccountSubtype.WALLET);
  if (!isCashAccount(sourceAccount) || !isCashAccount(receivingAccount)) {
    res.status(400).json({ error: "Transfers must use cash accounts." }); return;
  }

  let transaction;
  try {
    transaction = await prisma.$transaction((databaseTransaction) => assertCashBalancesNotNegative(
      databaseTransaction, user.id, [sourceAccountId, receivingAccountId], "Insufficient balance in the source cash account.",
      () => databaseTransaction.transaction.create({
        data: {
          ownerUserId: user.id,
          formType: TransactionFormType.PAYMENT_OR_CHARGE,
          sourceAccountId,
          receivingAccountId,
          totalAmount: amount,
          transactionDate,
          note: note.value,
          allocations: { create: [{ accountId: receivingAccountId, allocationType: AllocationType.TRANSFER, amount }] },
        },
        include: transactionInclude,
      }),
    ));
  } catch (error) {
    if (error instanceof CashOverdraftError) { res.status(400).json({ error: error.message }); return; }
    throw error;
  }
  res.status(201).json(transactionResponse(transaction));
}));

app.post("/api/transactions/repayment", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const amount = parsePositiveAmount(req.body?.totalAmount);
  if (!amount) { res.status(400).json({ error: "A valid positive amount is required." }); return; }
  const transactionDate = parseCalendarDate(req.body?.date);
  if (!transactionDate) { res.status(400).json({ error: "A valid calendar date in YYYY-MM-DD form is required." }); return; }
  const note = parseOptionalNote(req.body?.note);
  if (!note.valid) { res.status(400).json({ error: "The note must be 200 characters or fewer." }); return; }
  const sourceAccountId = Number(req.body?.sourceAccountId);
  const receivingAccountId = Number(req.body?.receivingAccountId);
  if (!Number.isInteger(sourceAccountId) || sourceAccountId <= 0) { res.status(400).json({ error: "A valid bank source account is required." }); return; }
  if (!Number.isInteger(receivingAccountId) || receivingAccountId <= 0) { res.status(400).json({ error: "A valid credit-card destination is required." }); return; }

  const prisma = getPrisma();
  const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
  if (!sourceAccount) { res.status(404).json({ error: "Source account not found." }); return; }
  if (sourceAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Source account access is not allowed." }); return; }
  if (sourceAccount.type !== AccountType.CASH || sourceAccount.subtype !== AccountSubtype.BANK) {
    res.status(400).json({ error: "Repayments must use a bank account." }); return;
  }

  const receivingAccount = await prisma.account.findUnique({ where: { id: receivingAccountId } });
  if (!receivingAccount) { res.status(404).json({ error: "Credit-card account not found." }); return; }
  if (receivingAccount.ownerUserId !== user.id) { res.status(403).json({ error: "Credit-card account access is not allowed." }); return; }
  if (receivingAccount.type !== AccountType.LOAN_TAKEN || receivingAccount.subtype !== AccountSubtype.CREDIT_CARD) {
    res.status(400).json({ error: "Repayments must use a credit-card account." }); return;
  }

  let transaction;
  try {
    transaction = await prisma.$transaction((databaseTransaction) => assertCashBalancesNotNegative(
      databaseTransaction, user.id, [sourceAccountId], "Insufficient bank balance for this repayment.",
      () => databaseTransaction.transaction.create({
        data: {
          ownerUserId: user.id,
          formType: TransactionFormType.PAYMENT_OR_CHARGE,
          sourceAccountId,
          receivingAccountId,
          totalAmount: amount,
          transactionDate,
          note: note.value,
          allocations: { create: [{ accountId: receivingAccountId, allocationType: AllocationType.REPAYMENT, amount }] },
        },
        include: transactionInclude,
      }),
    ));
  } catch (error) {
    if (error instanceof CashOverdraftError) { res.status(400).json({ error: error.message }); return; }
    throw error;
  }
  res.status(201).json(transactionResponse(transaction));
}));

app.get("/api/transactions", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const transactions = await getPrisma().transaction.findMany({ where: { ownerUserId: user.id }, orderBy: [{ transactionDate: "desc" }, { id: "desc" }], include: transactionInclude });
  res.status(200).json(transactions.map(transactionResponse));
}));

app.get("/api/transactions/:transactionId", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const transactionId = Number(req.params.transactionId);
  if (!Number.isInteger(transactionId) || transactionId <= 0) { res.status(400).json({ error: "A valid transaction ID is required." }); return; }
  const transaction = await getPrisma().transaction.findUnique({ where: { id: transactionId }, include: transactionInclude });
  if (!transaction) { res.status(404).json({ error: "Transaction not found." }); return; }
  if (transaction.ownerUserId !== user.id) { res.status(403).json({ error: "Transaction access is not allowed." }); return; }
  res.status(200).json(transactionResponse(transaction));
}));

app.get("/api/summaries", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const lines = await getPrisma().allocationLine.groupBy({ by: ["allocationType"], where: { transaction: { ownerUserId: user.id } }, _sum: { amount: true } });
  const sumFor = (type: AllocationType) => lines.find((line) => line.allocationType === type)?._sum.amount?.toString() ?? "0";
  const prisma = getPrisma();
  const [balances, accounts] = await Promise.all([
    calculateAccountBalances(prisma, user.id),
    prisma.account.findMany({ where: { ownerUserId: user.id }, select: { id: true, type: true } }),
  ]);
  const balanceById = new Map(balances.map((account) => [account.accountId, new Prisma.Decimal(account.balance)]));
  let loansGivenOutstanding = new Prisma.Decimal(0);
  let loansTakenOutstanding = new Prisma.Decimal(0);
  for (const account of accounts) {
    const balance = balanceById.get(account.id);
    if (!balance) continue;
    if (account.type === AccountType.LOAN_GIVEN && balance.isPositive()) loansGivenOutstanding = loansGivenOutstanding.add(balance);
    if (account.type === AccountType.LOAN_TAKEN && balance.isNegative()) loansTakenOutstanding = loansTakenOutstanding.sub(balance);
  }
  res.status(200).json({
    income: sumFor(AllocationType.INCOME),
    expenses: sumFor(AllocationType.EXPENSE),
    loansGivenOutstanding: loansGivenOutstanding.toString(),
    loansTakenOutstanding: loansTakenOutstanding.toString(),
  });
}));

app.get("/api/summaries/balances", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const balances = await calculateAccountBalances(getPrisma(), user.id);
  res.status(200).json({ accounts: balances });
}));

app.get("/api/admin/users", asyncRoute(async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const users = await getPrisma().user.findMany({
    select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  res.status(200).json(users);
}));

app.patch("/api/admin/users/:userId/status", asyncRoute(async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0 || typeof req.body?.enabled !== "boolean") {
    res.status(400).json({ error: "A valid user ID and enabled status are required." }); return;
  }
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true } });
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const updated = await getPrisma().user.update({ where: { id: userId }, data: { enabled: req.body.enabled }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true } });
  if (!updated.enabled) await endUserSessions(userId);
  res.status(200).json(updated);
}));

// Serve the built React app when STATIC_DIR is set (in the Docker image).
// Unset in tests and local `npm run dev`, so they are unaffected.
const staticDir = process.env.STATIC_DIR;
if (staticDir) {
  app.use(express.static(staticDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
}

app.use((_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: "Unable to complete the request." });
});
