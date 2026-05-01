export type BillingStatus = {
  isPro: boolean;
  trialEndsAt: string | null;
  proActivatedAt: string | null;
  trialActive: boolean;
  needsPayment: boolean;
};

export type PaymentIntentPayload = {
  clientSecret: string;
  amountCents: number;
  currency: string;
};
