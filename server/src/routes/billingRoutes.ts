import { Router } from "express";
import type { RequestHandler } from "express";
import { BillingController } from "../controllers/billingController";

export const createBillingRouter = (controller: BillingController, requireAuth: RequestHandler) => {
  const router = Router();

  router.get("/status", requireAuth, controller.status);
  router.post("/create-payment-intent", requireAuth, controller.createPaymentIntent);

  return router;
};
