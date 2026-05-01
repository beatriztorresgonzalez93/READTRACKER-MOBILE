import { Request, Response } from "express";
import { logError } from "../logger";
import { env } from "../config/env";
import { BillingService } from "../services/billingService";
import { sendApiError } from "../utils/apiResponse";

export class BillingController {
  constructor(private readonly service: BillingService) {}

  status = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const data = await this.service.getStatus(userId);
      res.status(200).json({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo obtener el estado de facturación";
      if (message.includes("no encontrado")) {
        sendApiError(res, 404, "USER_NOT_FOUND", message);
        return;
      }
      logError("BillingController.status", error);
      sendApiError(res, 500, "BILLING_STATUS_FAILED", "No se pudo obtener el estado de facturación");
    }
  };

  createPaymentIntent = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const data = await this.service.createPaymentIntent(userId);
      res.status(200).json({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el pago";
      if (message.includes("no encontrado")) {
        sendApiError(res, 404, "USER_NOT_FOUND", message);
        return;
      }
      if (message.includes("STRIPE_SECRET_KEY")) {
        sendApiError(res, 500, "STRIPE_NOT_CONFIGURED", "Stripe no está configurado en el servidor");
        return;
      }
      logError("BillingController.createPaymentIntent", error);
      sendApiError(res, 500, "PAYMENT_INTENT_FAILED", "No se pudo crear el pago");
    }
  };

  webhook = async (req: Request, res: Response) => {
    try {
      let event;
      if (env.stripeWebhookSecret.trim()) {
        const signature = req.headers["stripe-signature"];
        if (typeof signature !== "string") {
          sendApiError(res, 400, "MISSING_STRIPE_SIGNATURE", "Falta la firma Stripe");
          return;
        }
        event = this.service.constructEvent(req.body as Buffer, signature);
      } else {
        event = JSON.parse((req.body as Buffer).toString("utf8"));
      }

      if (event.type === "payment_intent.succeeded") {
        await this.service.handlePaymentSucceeded(event);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logError("BillingController.webhook", error);
      sendApiError(res, 400, "STRIPE_WEBHOOK_INVALID", "Webhook de Stripe inválido");
    }
  };
}
