import Stripe from "stripe";
import { env } from "../config/env";
import { UsersRepository } from "../repositories/usersRepository";
import { BillingStatus, PaymentIntentResult } from "../types/billing";

export class BillingService {
  private readonly stripe: InstanceType<typeof Stripe> | null;

  constructor(private readonly usersRepository: UsersRepository) {
    this.stripe = env.stripeSecretKey.trim() ? new Stripe(env.stripeSecretKey) : null;
  }

  async getStatus(userId: string): Promise<BillingStatus> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    const trialActive = BillingService.isTrialActive(user.trialEndsAt);

    return {
      isPro: user.isPro,
      trialEndsAt: user.trialEndsAt,
      proActivatedAt: user.proActivatedAt,
      trialActive,
      needsPayment: !user.isPro && !trialActive,
    };
  }

  /** Pro activo o prueba gratuita vigente. */
  async hasAppAccess(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return false;
    }
    return user.isPro || BillingService.isTrialActive(user.trialEndsAt);
  }

  static isTrialActive(trialEndsAt: string | null | undefined): boolean {
    if (!trialEndsAt) return false;
    const ends = new Date(trialEndsAt);
    return !Number.isNaN(ends.getTime()) && ends.getTime() > Date.now();
  }

  async createPaymentIntent(userId: string): Promise<PaymentIntentResult> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (!this.stripe) {
      throw new Error("Falta STRIPE_SECRET_KEY en variables de entorno");
    }

    let stripeCustomerId = await this.usersRepository.findStripeCustomerIdByUserId(userId);
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;
      await this.usersRepository.saveStripeCustomerId(userId, stripeCustomerId);
    }
    if (!stripeCustomerId) {
      throw new Error("No se pudo resolver el cliente de Stripe");
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: env.proOneTimePriceCents,
      currency: env.stripeCurrency,
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        product: "readtracker_pro_lifetime"
      }
    });

    if (!intent.client_secret) {
      throw new Error("No se pudo generar client secret de Stripe");
    }

    return {
      clientSecret: intent.client_secret,
      amountCents: env.proOneTimePriceCents,
      currency: env.stripeCurrency
    };
  }

  constructEvent(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new Error("Falta STRIPE_SECRET_KEY en variables de entorno");
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  }

  async handlePaymentSucceeded(event: { data: { object: Record<string, unknown> } }): Promise<void> {
    const paymentIntent = event.data.object as Record<string, unknown>;
    const metadata = (paymentIntent.metadata as Record<string, string> | undefined) ?? undefined;
    const customerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;
    const userId = metadata?.userId;

    if (customerId) {
      await this.usersRepository.activateProByStripeCustomerId(customerId);
      return;
    }
    if (userId) {
      await this.usersRepository.activateProByUserId(userId);
    }
  }
}
