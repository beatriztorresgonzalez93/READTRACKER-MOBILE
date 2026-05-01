// Middleware global para capturar errores no controlados y responder 500.
import { NextFunction, Request, Response } from "express";
import { logError } from "../logger";
import { sendApiError } from "../utils/apiResponse";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error.message?.toLowerCase().includes("cors")) {
    sendApiError(res, 403, "CORS_ORIGIN_NOT_ALLOWED", "Origen no permitido por CORS");
    return;
  }

  logError("errorHandler", error, {
    requestId: res.locals.requestId as string | undefined,
    endpoint: _req.originalUrl,
    method: _req.method
  });
  sendApiError(res, 500, "INTERNAL_SERVER_ERROR", "Error interno del servidor");
};
