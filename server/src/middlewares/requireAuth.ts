// Middleware JWT para proteger rutas y adjuntar userId a la request.
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sendApiError } from "../utils/apiResponse";

interface TokenPayload {
  sub?: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    if (!payload.sub) {
      sendApiError(res, 401, "INVALID_TOKEN", "Token inválido");
      return;
    }
    res.locals.userId = payload.sub;
    next();
  } catch {
    sendApiError(res, 401, "INVALID_OR_EXPIRED_TOKEN", "Token inválido o expirado");
  }
};
