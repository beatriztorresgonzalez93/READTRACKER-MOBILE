import { Router } from "express";
import type { RequestHandler } from "express";
import { NotificationsController } from "../controllers/notificationsController";

export const createNotificationsRouter = (
  controller: NotificationsController,
  requireAuth: RequestHandler,
) => {
  const router = Router();

  router.post("/register", requireAuth, controller.registerToken);
  router.post("/unregister", requireAuth, controller.unregisterToken);
  router.post("/activity", requireAuth, controller.touchActivity);
  router.get("/preferences", requireAuth, controller.getPreferences);
  router.patch("/preferences", requireAuth, controller.patchPreferences);
  router.post("/cron/engagement", controller.runEngagementCron);
  router.post("/dev/simulate-inactivity/me", requireAuth, controller.simulateInactivityMe);
  router.post("/dev/simulate-inactivity", controller.simulateInactivityByEmail);

  return router;
};
