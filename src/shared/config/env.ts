// Centraliza variables de entorno y valores por defecto de red.
const DEFAULT_API_BASE_URL = "https://readtracker-api.onrender.com/api/v1";

function parseTrialDays(value: string | undefined): number {
  const n = Number(value ?? "30");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

/** URL pública de la app en web (Vercel). En nativo sirve para abrir el checkout Pro en el navegador. */
function normalizeWebOrigin(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/$/, "");
}

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  /** Base URL sin barra final, ej. https://tu-app.vercel.app */
  webAppOrigin: normalizeWebOrigin(process.env.EXPO_PUBLIC_WEB_APP_ORIGIN),
  proTrialDays: parseTrialDays(process.env.EXPO_PUBLIC_PRO_TRIAL_DAYS),
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? ""
};

