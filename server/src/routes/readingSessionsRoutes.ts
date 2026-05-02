// Rutas protegidas para API de sesiones de lectura.
import { Router } from "express";
import type { RequestHandler } from "express";
import { ReadingSessionsController } from "../controllers/readingSessionsController";
import { validateCreateReadingSession } from "../middlewares/validateReadingSessionPayload";

export const createReadingSessionsRouter = (
  controller: ReadingSessionsController,
  requireAuth: RequestHandler
) => {
  const router = Router();
  router.use(requireAuth);
  router.get("/", controller.listSessions);
  router.post("/", validateCreateReadingSession, controller.createSession);
  router.delete("/:id", controller.deleteSession);
  return router;
};
