// Tests HTTP de contrato, auth y errores para los endpoints principales.
import express from "express";
import type { RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../src/controllers/authController";
import { BillingController } from "../src/controllers/billingController";
import { BooksController } from "../src/controllers/booksController";
import { ReadingSessionsController } from "../src/controllers/readingSessionsController";
import { WishlistController } from "../src/controllers/wishlistController";
import { errorHandler } from "../src/middlewares/errorHandler";
import { createAuthRouter } from "../src/routes/authRoutes";
import { createBillingRouter } from "../src/routes/billingRoutes";
import { createBooksRouter } from "../src/routes/booksRoutes";
import { createReadingSessionsRouter } from "../src/routes/readingSessionsRoutes";
import { createWishlistRouter } from "../src/routes/wishlistRoutes";
import { sendApiError } from "../src/utils/apiResponse";

/** Simula usuario autenticado sin Firebase (solo para tests de contrato HTTP). */
const stubRequireAuth: RequestHandler = (_req, res, next) => {
  const header = _req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
    return;
  }
  res.locals.userId = "user-1";
  next();
};

const AUTH = "Bearer integration-test-token";

describe("HTTP integration: contract + auth + errors", () => {
  const authServiceMock = {
    getProfile: vi.fn(),
    updateProfile: vi.fn()
  };
  const booksServiceMock = {
    getBooksPage: vi.fn(),
    getLibrarySummary: vi.fn(),
    getBookById: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
    deleteBook: vi.fn()
  };
  const readingSessionsServiceMock = {
    getSessions: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn()
  };
  const wishlistServiceMock = {
    list: vi.fn(),
    listAcquisitions: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    purchase: vi.fn()
  };
  const billingServiceMock = {
    getStatus: vi.fn(),
    createPaymentIntent: vi.fn(),
    constructEvent: vi.fn(),
    handlePaymentSucceeded: vi.fn()
  };

  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", createAuthRouter(new AuthController(authServiceMock as never), stubRequireAuth));
  app.use("/api/v1/books", createBooksRouter(new BooksController(booksServiceMock as never), stubRequireAuth));
  app.use(
    "/api/v1/wishlist",
    createWishlistRouter(new WishlistController(wishlistServiceMock as never), stubRequireAuth)
  );
  app.use(
    "/api/v1/reading-sessions",
    createReadingSessionsRouter(new ReadingSessionsController(readingSessionsServiceMock as never), stubRequireAuth)
  );
  app.use("/api/v1/billing", createBillingRouter(new BillingController(billingServiceMock as never), stubRequireAuth));
  app.use((_req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: "Ruta no encontrada", error: "Ruta no encontrada" });
  });
  app.use(errorHandler);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH /auth/me returns 200 when authorized", async () => {
    authServiceMock.updateProfile.mockResolvedValueOnce({
      id: "user-1",
      name: "Ana",
      lastName: "López",
      email: "user@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    const response = await request(app)
      .patch("/api/v1/auth/me")
      .set("Authorization", AUTH)
      .send({ name: "Ana", lastName: "López" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ name: "Ana", lastName: "López" });
    expect(authServiceMock.updateProfile).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "Ana", lastName: "López" })
    );
  });

  it("requires auth token for protected endpoints", async () => {
    const meResponse = await request(app).get("/api/v1/auth/me");
    const sessionsResponse = await request(app).get("/api/v1/reading-sessions");
    const booksResponse = await request(app).get("/api/v1/books");

    expect(meResponse.status).toBe(401);
    expect(meResponse.body.code).toBe("AUTH_REQUIRED");
    expect(sessionsResponse.status).toBe(401);
    expect(sessionsResponse.body.code).toBe("AUTH_REQUIRED");
    expect(booksResponse.status).toBe(401);
    expect(booksResponse.body.code).toBe("AUTH_REQUIRED");
  });

  it("returns 400 for invalid create book payload", async () => {
    const response = await request(app)
      .post("/api/v1/books")
      .set("Authorization", AUTH)
      .send({
        title: "",
        author: "Frank Herbert",
        status: "leyendo"
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_BOOK_REQUIRED_FIELDS");
  });

  it("returns books list for authorized user", async () => {
    booksServiceMock.getBooksPage.mockResolvedValueOnce({
      rows: [
        {
          id: "book-1",
          title: "Dune",
          author: "Frank Herbert",
          publisher: "Ace",
          genre: "Sci-Fi",
          status: "leyendo",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ],
      total: 1
    });

    const response = await request(app)
      .get("/api/v1/books")
      .set("Authorization", AUTH);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toMatchObject({ id: "book-1", title: "Dune" });
    expect(response.body.meta).toMatchObject({ total: 1, limit: 12, offset: 0 });
  });

  it("returns 201 for valid create book", async () => {
    booksServiceMock.createBook.mockResolvedValueOnce({
      id: "book-1",
      title: "Dune",
      author: "Frank Herbert",
      publisher: "Ace",
      genre: "Sci-Fi",
      status: "leyendo",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });

    const response = await request(app)
      .post("/api/v1/books")
      .set("Authorization", AUTH)
      .send({
        title: "Dune",
        author: "Frank Herbert",
        publisher: "Ace",
        genre: "Sci-Fi",
        status: "leyendo"
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      title: "Dune",
      status: "leyendo"
    });
  });

  it("returns 404 when updating a missing book", async () => {
    booksServiceMock.updateBook.mockResolvedValueOnce(null);

    const response = await request(app)
      .put("/api/v1/books/book-missing")
      .set("Authorization", AUTH)
      .send({ title: "Nuevo título" });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("BOOK_NOT_FOUND");
  });

  it("returns 400 for invalid update payload with unknown fields", async () => {
    const response = await request(app)
      .put("/api/v1/books/book-1")
      .set("Authorization", AUTH)
      .send({ foo: "bar" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UNKNOWN_BOOK_FIELDS");
    expect(response.body.details).toMatchObject({ fields: ["foo"] });
  });

  it("returns 200 for successful delete and 404 when book does not exist", async () => {
    booksServiceMock.deleteBook
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const okResponse = await request(app)
      .delete("/api/v1/books/book-1")
      .set("Authorization", AUTH);

    const notFoundResponse = await request(app)
      .delete("/api/v1/books/book-missing")
      .set("Authorization", AUTH);

    expect(okResponse.status).toBe(200);
    expect(okResponse.body.data).toMatchObject({ id: "book-1" });
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body.code).toBe("BOOK_NOT_FOUND");
  });

  it("returns 400 for invalid reading session payload", async () => {
    const response = await request(app)
      .post("/api/v1/reading-sessions")
      .set("Authorization", AUTH)
      .send({
        bookId: "book-1",
        currentPage: "twenty"
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_CURRENT_PAGE");
  });

  it("returns 404 BOOK_NOT_FOUND when session target book is missing", async () => {
    readingSessionsServiceMock.createSession.mockResolvedValueOnce(null);

    const response = await request(app)
      .post("/api/v1/reading-sessions")
      .set("Authorization", AUTH)
      .send({
        bookId: "book-missing",
        currentPage: 20
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("BOOK_NOT_FOUND");
  });

  it("returns 201 and data contract for valid reading session creation", async () => {
    readingSessionsServiceMock.createSession.mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      bookId: "book-1",
      title: "Dune",
      author: "Frank Herbert",
      previousPage: 10,
      currentPage: 20,
      pagesRead: 10,
      recordedAt: "2026-01-01T10:00:00.000Z",
      createdAt: "2026-01-01T10:00:00.000Z"
    });

    const response = await request(app)
      .post("/api/v1/reading-sessions")
      .set("Authorization", AUTH)
      .send({
        bookId: "book-1",
        previousPage: 10,
        currentPage: 20
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: "session-1",
      bookId: "book-1",
      currentPage: 20
    });
  });

  it("returns 404 SESSION_NOT_FOUND when deleting not owned/missing session", async () => {
    readingSessionsServiceMock.deleteSession.mockResolvedValueOnce(false);

    const response = await request(app)
      .delete("/api/v1/reading-sessions/session-unknown")
      .set("Authorization", AUTH);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("SESSION_NOT_FOUND");
  });

  it("returns 500 stable contract on reading sessions list internal error", async () => {
    readingSessionsServiceMock.getSessions.mockRejectedValueOnce(new Error("db failed"));

    const response = await request(app)
      .get("/api/v1/reading-sessions")
      .set("Authorization", AUTH);

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      code: "READING_SESSIONS_LIST_FAILED"
    });
  });

  it("returns 400 for invalid wishlist create payload", async () => {
    const response = await request(app)
      .post("/api/v1/wishlist")
      .set("Authorization", AUTH)
      .send({
        title: "",
        author: "Autor"
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_TITLE");
  });

  it("returns billing status for authorized user", async () => {
    billingServiceMock.getStatus.mockResolvedValueOnce({
      isPro: false,
      trialEndsAt: "2026-12-01T00:00:00.000Z",
      proActivatedAt: null,
      trialActive: true,
      needsPayment: false
    });

    const response = await request(app)
      .get("/api/v1/billing/status")
      .set("Authorization", AUTH);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      isPro: false,
      trialActive: true
    });
  });

  it("returns payment intent clientSecret for authorized user", async () => {
    billingServiceMock.createPaymentIntent.mockResolvedValueOnce({
      clientSecret: "pi_123_secret_456",
      amountCents: 1999,
      currency: "eur"
    });

    const response = await request(app)
      .post("/api/v1/billing/create-payment-intent")
      .set("Authorization", AUTH);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      clientSecret: "pi_123_secret_456",
      amountCents: 1999
    });
  });

  it("returns wishlist list and acquisitions for authorized user", async () => {
    wishlistServiceMock.list.mockResolvedValueOnce([
      {
        id: "wish-1",
        userId: "user-1",
        title: "The Hobbit",
        author: "Tolkien",
        price: "",
        store: "",
        priority: 3,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ]);
    wishlistServiceMock.listAcquisitions.mockResolvedValueOnce([
      {
        id: "acq-1",
        userId: "user-1",
        title: "Dune",
        author: "Frank Herbert",
        price: "20 EUR",
        store: "Casa del Libro",
        purchasedAt: "2026-01-02T00:00:00.000Z"
      }
    ]);

    const listResponse = await request(app)
      .get("/api/v1/wishlist")
      .set("Authorization", AUTH);
    const acquisitionsResponse = await request(app)
      .get("/api/v1/wishlist/acquisitions")
      .set("Authorization", AUTH);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data[0]).toMatchObject({ id: "wish-1" });
    expect(acquisitionsResponse.status).toBe(200);
    expect(acquisitionsResponse.body.data[0]).toMatchObject({ id: "acq-1" });
  });

  it("returns 201 for valid wishlist create", async () => {
    wishlistServiceMock.create.mockResolvedValueOnce({
      id: "wish-1",
      userId: "user-1",
      title: "The Hobbit",
      author: "Tolkien",
      price: "",
      store: "",
      priority: 3,
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    const response = await request(app)
      .post("/api/v1/wishlist")
      .set("Authorization", AUTH)
      .send({
        title: "The Hobbit",
        author: "Tolkien",
        priority: 3
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: "wish-1",
      title: "The Hobbit"
    });
  });

  it("returns 404 for wishlist update when item does not exist", async () => {
    wishlistServiceMock.update.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .put("/api/v1/wishlist/missing")
      .set("Authorization", AUTH)
      .send({
        title: "Title",
        author: "Author",
        priority: 3
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("WISHLIST_ITEM_NOT_FOUND");
  });

  it("returns 200 for wishlist purchase and 404 when missing", async () => {
    wishlistServiceMock.purchase
      .mockResolvedValueOnce({
        id: "acq-1",
        userId: "user-1",
        title: "The Hobbit",
        author: "Tolkien",
        price: "",
        store: "",
        purchasedAt: "2026-01-03T00:00:00.000Z"
      })
      .mockResolvedValueOnce(undefined);

    const okResponse = await request(app)
      .post("/api/v1/wishlist/wish-1/purchase")
      .set("Authorization", AUTH);
    const missingResponse = await request(app)
      .post("/api/v1/wishlist/missing/purchase")
      .set("Authorization", AUTH);

    expect(okResponse.status).toBe(200);
    expect(okResponse.body.data.id).toBe("acq-1");
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body.code).toBe("WISHLIST_ITEM_NOT_FOUND");
  });
});
