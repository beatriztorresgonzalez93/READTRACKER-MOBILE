// Rutas de subida (S3 presign) protegidas por Firebase ID token.
import { Router } from "express";
import type { RequestHandler } from "express";

import { UploadsController } from "../controllers/uploadsController";

export const createUploadsRouter = (
  controller: UploadsController,
  requireAuth: RequestHandler,
  requireProOrTrial: RequestHandler,
) => {
  const router = Router();
  router.use(requireAuth);
  router.use(requireProOrTrial);

  router.post("/cover", controller.presignCoverUpload);
  router.post("/avatar", controller.presignAvatarUpload);

  return router;
};
