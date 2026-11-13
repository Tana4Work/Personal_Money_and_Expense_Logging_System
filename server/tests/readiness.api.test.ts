import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

afterEach(() => vi.restoreAllMocks());
afterAll(async () => { await prisma.$disconnect(); });

describe("API readiness", () => {
  it("returns ready when the database query succeeds", async () => {
    const query = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([1] as never);
    await request(app).get("/api/ready").expect(201, { status: "ready", db: "connected" });
    expect(query).toHaveBeenCalledOnce();
  });

  it("returns 503 when the database query fails", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("Database unavailable"));
    await request(app).get("/api/ready").expect(503, { status: "not_ready" });
  });
});
