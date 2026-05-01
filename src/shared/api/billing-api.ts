import { apiRequest } from "@/shared/api/client";
import type { BillingStatus, PaymentIntentPayload } from "@/shared/types/billing";

export async function getBillingStatus(token: string): Promise<BillingStatus> {
  const response = await apiRequest<{ data?: BillingStatus } | BillingStatus>("/billing/status", { token });
  if ("data" in response && response.data) return response.data;
  return response as BillingStatus;
}

export async function createBillingPaymentIntent(token: string): Promise<PaymentIntentPayload> {
  const response = await apiRequest<{ data?: PaymentIntentPayload } | PaymentIntentPayload>(
    "/billing/create-payment-intent",
    {
      method: "POST",
      token
    }
  );
  if ("data" in response && response.data) return response.data;
  return response as PaymentIntentPayload;
}
