export interface BillingStatus {
  isPro: boolean;
  trialEndsAt: string | null;
  proActivatedAt: string | null;
  trialActive: boolean;
  needsPayment: boolean;
}

export interface PaymentIntentResult {
  clientSecret: string;
  amountCents: number;
  currency: string;
}
