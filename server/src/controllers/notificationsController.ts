import { Request, Response } from "express";
import { env } from "../config/env";
import { logError } from "../logger";
import { NotificationsService } from "../services/notificationsService";
import { sendApiError } from "../utils/apiResponse";
import { isDevPushToolsEnabled } from "../utils/devPushTools";

const EXPO_PUSH_TOKEN_PREFIX = "ExponentPushToken[";

function isValidExpoPushToken(value: string): boolean {
  return value.startsWith(EXPO_PUSH_TOKEN_PREFIX) && value.endsWith("]");
}

function parseSimulateDays(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return 5;
}

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  registerToken = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const body = req.body as Record<string, unknown>;
    const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
    const platform = typeof body.platform === "string" ? body.platform.trim() : "";

    if (!isValidExpoPushToken(expoPushToken)) {
      sendApiError(res, 400, "INVALID_PUSH_TOKEN", "Token push de Expo no válido");
      return;
    }
    if (!platform) {
      sendApiError(res, 400, "INVALID_PLATFORM", "Plataforma no válida");
      return;
    }

    try {
      await this.service.registerPushToken(userId, expoPushToken, platform);
      res.status(204).send();
    } catch (err) {
      logError("NotificationsController.registerToken", err);
      sendApiError(res, 500, "PUSH_REGISTER_FAILED", "No se pudo registrar el dispositivo");
    }
  };

  unregisterToken = async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
    if (!expoPushToken) {
      sendApiError(res, 400, "INVALID_PUSH_TOKEN", "Token push no válido");
      return;
    }

    try {
      await this.service.unregisterPushToken(expoPushToken);
      res.status(204).send();
    } catch (err) {
      logError("NotificationsController.unregisterToken", err);
      sendApiError(res, 500, "PUSH_UNREGISTER_FAILED", "No se pudo eliminar el dispositivo");
    }
  };

  touchActivity = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    try {
      await this.service.recordActivity(userId);
      res.status(204).send();
    } catch (err) {
      logError("NotificationsController.touchActivity", err);
      sendApiError(res, 500, "ACTIVITY_UPDATE_FAILED", "No se pudo actualizar la actividad");
    }
  };

  getPreferences = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    try {
      const pushEngagementEnabled = await this.service.getEngagementEnabled(userId);
      res.status(200).json({ data: { pushEngagementEnabled } });
    } catch (err) {
      logError("NotificationsController.getPreferences", err);
      sendApiError(res, 500, "PREFERENCES_LOAD_FAILED", "No se pudieron cargar las preferencias");
    }
  };

  patchPreferences = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const body = req.body as Record<string, unknown>;
    if (typeof body.pushEngagementEnabled !== "boolean") {
      sendApiError(res, 400, "INVALID_PREFERENCE", "pushEngagementEnabled debe ser booleano");
      return;
    }

    try {
      await this.service.setEngagementEnabled(userId, body.pushEngagementEnabled);
      res.status(200).json({ data: { pushEngagementEnabled: body.pushEngagementEnabled } });
    } catch (err) {
      logError("NotificationsController.patchPreferences", err);
      sendApiError(res, 500, "PREFERENCES_UPDATE_FAILED", "No se pudieron guardar las preferencias");
    }
  };

  simulateInactivityMe = async (req: Request, res: Response) => {
    if (!isDevPushToolsEnabled()) {
      sendApiError(res, 404, "NOT_FOUND", "Ruta no encontrada");
      return;
    }

    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const inactiveDays = parseSimulateDays(body.inactiveDays);
    const clearCooldown = body.clearCooldown !== false;

    try {
      const data = await this.service.simulateInactivityForUser(userId, { inactiveDays, clearCooldown });
      res.status(200).json({
        data: {
          ...data,
          hint:
            data.pushTokenCount === 0
              ? "Abre la app en un development build para registrar token push."
              : "Ejecuta npm run push:engagement para enviar la notificación.",
        },
      });
    } catch (err) {
      logError("NotificationsController.simulateInactivityMe", err);
      sendApiError(res, 500, "SIMULATE_INACTIVITY_FAILED", "No se pudo simular inactividad");
    }
  };

  simulateInactivityByEmail = async (req: Request, res: Response) => {
    if (!isDevPushToolsEnabled()) {
      sendApiError(res, 404, "NOT_FOUND", "Ruta no encontrada");
      return;
    }

    const secret = (req.headers["x-cron-secret"] as string | undefined)?.trim();
    if (!env.cronSecret || secret !== env.cronSecret) {
      sendApiError(res, 401, "CRON_UNAUTHORIZED", "No autorizado");
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      sendApiError(res, 400, "INVALID_EMAIL", "Indica email en el body");
      return;
    }

    const inactiveDays = parseSimulateDays(body.inactiveDays);
    const clearCooldown = body.clearCooldown !== false;

    try {
      const data = await this.service.simulateInactivityByEmail(email, { inactiveDays, clearCooldown });
      res.status(200).json({
        data: {
          ...data,
          email,
          hint:
            data.pushTokenCount === 0
              ? "Abre la app en un development build para registrar token push."
              : "Ejecuta npm run push:engagement para enviar la notificación.",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      if (message.includes("No hay usuario")) {
        sendApiError(res, 404, "USER_NOT_FOUND", message);
        return;
      }
      logError("NotificationsController.simulateInactivityByEmail", err);
      sendApiError(res, 500, "SIMULATE_INACTIVITY_FAILED", "No se pudo simular inactividad");
    }
  };

  runEngagementCron = async (req: Request, res: Response) => {
    const secret = (req.headers["x-cron-secret"] as string | undefined)?.trim();
    if (!env.cronSecret || secret !== env.cronSecret) {
      sendApiError(res, 401, "CRON_UNAUTHORIZED", "No autorizado");
      return;
    }

    try {
      const result = await this.service.runEngagementCampaign();
      res.status(200).json({ data: result });
    } catch (err) {
      logError("NotificationsController.runEngagementCron", err);
      sendApiError(res, 500, "ENGAGEMENT_CRON_FAILED", "No se pudo ejecutar la campaña");
    }
  };
}
