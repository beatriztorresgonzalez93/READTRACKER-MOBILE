// Rutas protegidas para API de sesiones de lectura.
import { Router } from "express";
import { ReadingSessionsController } from "../controllers/readingSessionsController";
import { requireAuth } from "../middlewares/requireAuth";
import { validateCreateReadingSession } from "../middlewares/validateReadingSessionPayload";

export const createReadingSessionsRouter = (controller: ReadingSessionsController) => {
  const router = Router();
  router.use(requireAuth);
  router.get("/", controller.listSessions);
  router.post("/", validateCreateReadingSession, controller.createSession);
  router.delete("/:id", controller.deleteSession);
  return router;
};
