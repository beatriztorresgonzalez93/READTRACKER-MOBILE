// Endpoints de perfil autenticado (token Firebase).
import { Router } from "express";
import type { RequestHandler } from "express";
import { AuthController } from "../controllers/authController";

export const createAuthRouter = (controller: AuthController, requireAuth: RequestHandler) => {
  const router = Router();

  router.get("/me", requireAuth, controller.me);
  router.patch("/me", requireAuth, controller.patchMe);

  return router;
};
