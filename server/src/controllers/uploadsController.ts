// Capa HTTP: URL firmada para subir portada a S3 (usuario ya autenticado con Firebase).
import type { Request, Response } from "express";

import { UploadsConfigError, UploadsService } from "../services/uploadsService";
import { sendApiError } from "../utils/apiResponse";
import { logError } from "../logger";

type PresignBody = {
  contentType?: string;
};

export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  presignCoverUpload = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const body = req.body as PresignBody;
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    if (!contentType.trim()) {
      sendApiError(res, 400, "INVALID_BODY", "contentType es obligatorio");
      return;
    }

    try {
      const data = await this.service.createCoverPresignedPut(userId, contentType);
      res.status(200).json({ data });
    } catch (err) {
      logError("UploadsController.presignCoverUpload", err);
      if (err instanceof UploadsConfigError) {
        sendApiError(res, 503, "S3_UPLOADS_DISABLED", err.message);
        return;
      }
      const message = err instanceof Error ? err.message : "No se pudo generar la URL de subida";
      sendApiError(res, 400, "PRESIGN_FAILED", message);
    }
  };
}
