import { Router } from "express";
import { BillingController } from "../controllers/billingController";
import { requireAuth } from "../middlewares/requireAuth";

export const createBillingRouter = (controller: BillingController) => {
  const router = Router();

  router.get("/status", requireAuth, controller.status);
  router.post("/create-payment-intent", requireAuth, controller.createPaymentIntent);

  return router;
};
