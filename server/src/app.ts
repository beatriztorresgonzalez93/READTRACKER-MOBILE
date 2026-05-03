// Punto de entrada del backend: configura Express, middlewares y rutas principales.
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "http";
import { initDb } from "./config/db";
import { pool } from "./config/db";
import { env } from "./config/env";
import { BooksController } from "./controllers/booksController";
import { CoversController } from "./controllers/coversController";
import { AuthController } from "./controllers/authController";
import { WishlistController } from "./controllers/wishlistController";
import { ReadingSessionsController } from "./controllers/readingSessionsController";
import { BillingController } from "./controllers/billingController";
import { UploadsController } from "./controllers/uploadsController";
import { errorHandler } from "./middlewares/errorHandler";
import { createRequireAuth } from "./middlewares/requireAuth";
import { BooksRepository } from "./repositories/booksRepository";
import { UsersRepository } from "./repositories/usersRepository";
import { WishlistRepository } from "./repositories/wishlistRepository";
import { ReadingSessionsRepository } from "./repositories/readingSessionsRepository";
import { createAuthRouter } from "./routes/authRoutes";
import { createBooksRouter } from "./routes/booksRoutes";
import { createCoversRouter } from "./routes/coversRoutes";
import { createWishlistRouter } from "./routes/wishlistRoutes";
import { createReadingSessionsRouter } from "./routes/readingSessionsRoutes";
import { createBillingRouter } from "./routes/billingRoutes";
import { createUploadsRouter } from "./routes/uploadsRoutes";
import { AuthService } from "./services/authService";
import { BooksService } from "./services/booksService";
import { CoversService } from "./services/coversService";
import { WishlistService } from "./services/wishlistService";
import { ReadingSessionsService } from "./services/readingSessionsService";
import { BillingService } from "./services/billingService";
import { UploadsService } from "./services/uploadsService";
import { sendApiError } from "./utils/apiResponse";
import { logError, logInfo } from "./logger";
import { requestLogging } from "./middlewares/requestLogging";

function normalizeOrigin(origin: string): string {
  // El header `Origin` normalmente viene sin path; normalizamos también
  // un slash final accidental y forzamos minúsculas.
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

function isCorsAllowedOrigin(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (env.clientOrigins.includes(normalized)) {
    return true;
  }
  // Vercel previews dinámicos solo si está habilitado explícitamente por entorno.
  if (
    env.corsAllowVercelPreviews &&
    normalized.startsWith("https://") &&
    normalized.endsWith(".vercel.app")
  ) {
    return true;
  }
  if (!normalized.startsWith("https://")) {
    return false;
  }
  return env.corsOriginSuffixes.some((suffix) => normalized.endsWith(suffix));
}

export const createApp = () => {
  // Separamos createApp para reutilizar la misma app en tests E2E sin abrir puerto.
  const app = express();

  app.use(requestLogging);
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      limit: env.rateLimitMaxRequests,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) => {
        sendApiError(res, 429, "RATE_LIMIT_EXCEEDED", "Demasiadas peticiones. Inténtalo de nuevo en unos segundos.");
      }
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          // Permite clientes no navegador (health checks, scripts internos).
          callback(null, true);
          return;
        }
        if (isCorsAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS origin blocked"));
      }
    })
  );
  // Stripe exige body crudo para verificar firma del webhook.
  app.use("/api/v1/billing/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "512kb" }));

  const booksRepository = new BooksRepository();
  const booksService = new BooksService(booksRepository);
  const booksController = new BooksController(booksService);
  const usersRepository = new UsersRepository();
  const authService = new AuthService(usersRepository);
  const requireAuthMw = createRequireAuth(authService);
  const authController = new AuthController(authService);
  const coversService = new CoversService();
  const coversController = new CoversController(coversService);
  const uploadsService = new UploadsService();
  const uploadsController = new UploadsController(uploadsService);
  const wishlistRepository = new WishlistRepository();
  const wishlistService = new WishlistService(wishlistRepository);
  const wishlistController = new WishlistController(wishlistService);
  const readingSessionsRepository = new ReadingSessionsRepository();
  const readingSessionsService = new ReadingSessionsService(readingSessionsRepository);
  const readingSessionsController = new ReadingSessionsController(readingSessionsService);
  const billingService = new BillingService(usersRepository);
  const billingController = new BillingController(billingService);

  app.post("/api/v1/billing/webhook", billingController.webhook);
  app.get("/api/v1/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.status(200).json({
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime())
        }
      });
    } catch (error) {
      logError("healthcheck", error);
      sendApiError(res, 503, "HEALTHCHECK_DB_FAILED", "El servicio no está listo");
    }
  });

  app.use("/api/v1/covers", createCoversRouter(coversController));
  app.use("/api/v1/uploads", createUploadsRouter(uploadsController, requireAuthMw));
  app.use("/api/v1/auth", createAuthRouter(authController, requireAuthMw));
  app.use("/api/v1/books", createBooksRouter(booksController, requireAuthMw));
  app.use("/api/v1/wishlist", createWishlistRouter(wishlistController, requireAuthMw));
  app.use("/api/v1/reading-sessions", createReadingSessionsRouter(readingSessionsController, requireAuthMw));
  app.use("/api/v1/billing", createBillingRouter(billingController, requireAuthMw));
  app.get("/api/v1/acquisitions", requireAuthMw, wishlistController.listAcquisitions);

  app.use((_req, res) => {
    sendApiError(res, 404, "NOT_FOUND", "Ruta no encontrada");
  });
  app.use(errorHandler);

  return app;
};

export const startServer = async () => {
  // Arranque productivo: chequea config/DB, aplica migraciones y levanta HTTP.
  let server: Server | null = null;
  try {
    logInfo("startup.check", {
      status: "ok",
      check: "config",
      nodeEnv: env.nodeEnv
    });
    await pool.query("SELECT 1");
    logInfo("startup.check", { status: "ok", check: "database_connection" });
    await initDb();
    logInfo("startup.check", { status: "ok", check: "database_schema" });

    const app = createApp();
    server = app.listen(env.port, () => {
      logInfo("startup.server", {
        status: "listening",
        port: env.port
      });
    });

    const gracefulShutdown = (signal: string) => {
      // Cierre ordenado: primero HTTP, luego pool DB, para evitar requests "a medias".
      logInfo("shutdown.start", { signal });
      if (!server) {
        void pool.end().finally(() => process.exit(0));
        return;
      }
      server.close((httpErr) => {
        if (httpErr) {
          logError("shutdown.http_close_failed", httpErr);
          process.exit(1);
          return;
        }
        void pool
          .end()
          .then(() => {
            logInfo("shutdown.complete", { signal });
            process.exit(0);
          })
          .catch((dbErr) => {
            logError("shutdown.db_close_failed", dbErr);
            process.exit(1);
          });
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logError("startup.failure", error);
    process.exit(1);
  }
};

if (require.main === module) {
  void startServer();
}
