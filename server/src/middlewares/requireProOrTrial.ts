// Middleware: exige Pro activo o periodo de prueba vigente (tras requireAuth).
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env";
import { logError } from "../logger";
import { BillingService } from "../services/billingService";
import { sendApiError } from "../utils/apiResponse";

export function createRequireProOrTrial(billingService: BillingService): RequestHandler {
  return async (_req: Request, res: Response, next: NextFunction) => {
    if (!env.billingEnforceAccess) {
      next();
      return;
    }

    const userId = res.locals?.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    try {
      const allowed = await billingService.hasAppAccess(userId);
      if (!allowed) {
        sendApiError(
          res,
          402,
          "SUBSCRIPTION_REQUIRED",
          "Activa Scriptorium Pro o usa el periodo de prueba para acceder a esta funcion.",
        );
        return;
      }
      next();
    } catch (error) {
      logError("requireProOrTrial", error);
      sendApiError(res, 500, "BILLING_CHECK_FAILED", "No se pudo comprobar tu plan");
    }
  };
}
