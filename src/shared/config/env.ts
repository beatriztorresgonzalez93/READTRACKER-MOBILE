// Centraliza variables de entorno y valores por defecto de red.
import { Platform } from "react-native";

const DEFAULT_API_BASE_URL = "https://readtracker-api.onrender.com/api/v1";
/** En web (Vercel) las peticiones van al mismo origen; vercel.json reenvía /api/v1 → Render. */
const WEB_API_BASE_URL = "/api/v1";

function parseTrialDays(value: string | undefined): number {
  const n = Number(value ?? "30");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

/** URL pública de la app en web (Vercel). En nativo sirve para abrir el checkout Pro en el navegador. */
function normalizeWebOrigin(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/$/, "");
}

function resolveApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");

  if (Platform.OS !== "web") {
    return configured || DEFAULT_API_BASE_URL;
  }

  const host =
    typeof globalThis !== "undefined" &&
    "location" in globalThis &&
    globalThis.location &&
    typeof (globalThis.location as Location).hostname === "string"
      ? (globalThis.location as Location).hostname
      : "";

  if (host === "localhost" || host === "127.0.0.1") {
    if (configured && !configured.includes("onrender.com")) return configured;
    return "http://localhost:4000/api/v1";
  }

  if (!configured || configured.includes("onrender.com")) {
    return WEB_API_BASE_URL;
  }
  return configured;
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
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

