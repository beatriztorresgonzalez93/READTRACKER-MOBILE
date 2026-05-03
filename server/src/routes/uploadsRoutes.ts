// Rutas de subida (S3 presign) protegidas por Firebase ID token.
import { Router } from "express";
import type { RequestHandler } from "express";

import { UploadsController } from "../controllers/uploadsController";

export const createUploadsRouter = (controller: UploadsController, requireAuth: RequestHandler) => {
  const router = Router();

  router.post("/cover", requireAuth, controller.presignCoverUpload);

  return router;
};
