// Endpoints de autenticación.
import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { requireAuth } from "../middlewares/requireAuth";

export const createAuthRouter = (controller: AuthController) => {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/me", requireAuth, controller.me);
  router.patch("/me", requireAuth, controller.patchMe);

  return router;
};
