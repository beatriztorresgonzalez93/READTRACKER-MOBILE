// Centraliza variables de entorno y valores por defecto de red.
const DEFAULT_API_BASE_URL = "https://readtracker-api.onrender.com/api/v1";

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
};

