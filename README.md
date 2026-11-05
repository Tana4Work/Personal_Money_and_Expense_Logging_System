# Personal Money and Expense Logging System

## Stack

React 18, TypeScript, Vite 6, Bootstrap 5.3, and CSS; Node.js with Express 4 and TypeScript; PostgreSQL with Prisma 5. Authentication uses bearer session tokens and salted scrypt hashes. Tests use Vitest, React Testing Library, Supertest, and Playwright.

## Local setup

1. Install Node.js, npm, and Docker Desktop.
2. Start PostgreSQL:

   ```powershell
   docker run --name money-tracker-postgres -e POSTGRES_USER=toktickit -e POSTGRES_PASSWORD=toktickit -e POSTGRES_DB=toktickit -p 127.0.0.1:5432:5432 -v money-tracker-postgres-data:/var/lib/postgresql/data -d postgres:17
   ```

   Later, use `docker start money-tracker-postgres`.
3. Copy `server/.env.example` to `server/.env`; set `DATABASE_URL`, `SEED_USER_PASSWORD`, and `SEED_ADMIN_PASSWORD` to synthetic local values. Do not commit `.env` files or real passwords.
4. Install, migrate, and seed:

   ```powershell
   npm --prefix server install
   npm --prefix client install
   npm --prefix server run prisma:deploy
   npm --prefix server run prisma:seed
   ```

5. Run `npm --prefix server run dev` and `npm --prefix client run dev` in separate terminals, then open `http://localhost:5173`.

### Frontend Docker container

With the backend running on port 3000, build and start the frontend container:

```text
docker compose up --build -d frontend
```

Open `http://localhost:5173`. The container serves the frontend on port 5173 and proxies `/api` to the backend on port 3000. Stop it with `docker compose down`.

Seeded identities: `demo.user@money.local` and `demo.admin@money.local`. Use their local passwords from `server/.env`.

## Verify

```powershell
npm run build
npm --prefix server test
npm --prefix client test
```

Server API tests use the PostgreSQL database configured in `server/.env`.
