// Middleware de logging por request con request-id para trazabilidad.
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { logInfo } from "../logger";

export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logInfo("http.request", {
      requestId,
      method: req.method,
      endpoint: req.originalUrl,
      status: res.statusCode,
      durationMs
    });
  });

  next();
};
