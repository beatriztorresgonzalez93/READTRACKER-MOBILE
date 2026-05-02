// Middleware: Bearer token = Firebase ID token; crea/resuelve usuario local.
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin";
import { AuthService } from "../services/authService";
import { sendApiError } from "../utils/apiResponse";

export function createRequireAuth(authService: AuthService): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    try {
      const decoded = await verifyFirebaseIdToken(token);
      const userId = await authService.ensureLocalUserFromFirebase(decoded);
      res.locals.userId = userId;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("Ya existe una cuenta local")) {
        sendApiError(res, 409, "ACCOUNT_EMAIL_CONFLICT", message);
        return;
      }
      sendApiError(res, 401, "INVALID_OR_EXPIRED_TOKEN", "Token inválido o expirado");
    }
  };
}
