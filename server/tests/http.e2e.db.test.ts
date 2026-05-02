// E2E backend con DB real para validar flujo crítico de sesiones y progreso.
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/firebaseAdmin", () => ({
  verifyFirebaseIdToken: vi.fn()
}));

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabaseUrl ? describe : describe.skip;

describeDb("HTTP E2E with real database", () => {
  let app: Parameters<typeof request>[0];
  let initDb: () => Promise<void>;
  let pool: { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; end: () => Promise<void> };
  const testEmail = `e2e-db-${Date.now()}@example.com`;
  const E2E_BEARER = "Bearer e2e-fake-firebase-jwt";

  beforeAll(async () => {
    const { verifyFirebaseIdToken } = await import("../src/config/firebaseAdmin");
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({
      uid: "e2e-firebase-user",
      email: testEmail,
      name: "E2E DB"
    } as never);

    const appModule = await import("../src/app");
    const dbModule = await import("../src/config/db");
    app = appModule.createApp();
    initDb = dbModule.initDb;
    pool = dbModule.pool;
    await initDb();
    await pool.query("DELETE FROM users WHERE email = $1 OR firebase_uid = $2", [testEmail, "e2e-firebase-user"]);
  });

  afterAll(async () => {
    if (!hasDatabaseUrl) return;
    await pool.query("DELETE FROM users WHERE email = $1 OR firebase_uid = $2", [testEmail, "e2e-firebase-user"]);
    await pool.end();
  });

  it("creates and deletes sessions recalculating book progress", async () => {
    const createBookResponse = await request(app)
      .post("/api/v1/books")
      .set("Authorization", E2E_BEARER)
      .send({
        title: "E2E Dune",
        author: "Frank Herbert",
        publisher: "Ace",
        genre: "Sci-Fi",
        status: "leyendo",
        pages: 100
      });
    expect(createBookResponse.status).toBe(201);
    const bookId = createBookResponse.body?.data?.id as string;
    expect(bookId).toBeTruthy();

    const firstSessionResponse = await request(app)
      .post("/api/v1/reading-sessions")
      .set("Authorization", E2E_BEARER)
      .send({
        bookId,
        previousPage: 0,
        currentPage: 20,
        recordedAt: "2026-04-20T10:00:00.000Z"
      });
    expect(firstSessionResponse.status).toBe(201);

    const secondSessionResponse = await request(app)
      .post("/api/v1/reading-sessions")
      .set("Authorization", E2E_BEARER)
      .send({
        bookId,
        previousPage: 20,
        currentPage: 40,
        recordedAt: "2026-04-21T10:00:00.000Z"
      });
    expect(secondSessionResponse.status).toBe(201);
    const secondSessionId = secondSessionResponse.body?.data?.id as string;
    expect(secondSessionId).toBeTruthy();

    const deleteSessionResponse = await request(app)
      .delete(`/api/v1/reading-sessions/${secondSessionId}`)
      .set("Authorization", E2E_BEARER);
    expect(deleteSessionResponse.status).toBe(200);

    const getBookResponse = await request(app)
      .get(`/api/v1/books/${bookId}`)
      .set("Authorization", E2E_BEARER);
    expect(getBookResponse.status).toBe(200);
    expect(getBookResponse.body?.data?.currentPage).toBe(20);
    expect(getBookResponse.body?.data?.progress).toBe(20);
  });
});
