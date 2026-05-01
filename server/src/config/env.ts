// Carga y exporta variables de entorno del backend con valores por defecto.
import dotenv from "dotenv";

dotenv.config();

const isProduction = (process.env.NODE_ENV ?? "").toLowerCase() === "production";
const jwtSecretFromEnv = process.env.JWT_SECRET ?? "";
// Fail-fast: en prod nunca arrancamos con secreto por defecto o vacío.
if (isProduction && (!jwtSecretFromEnv.trim() || jwtSecretFromEnv === "change-this-secret-in-production")) {
  throw new Error("JWT_SECRET seguro es obligatorio en producción");
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function normalizeOrigin(origin: string): string {
  // El header `Origin` en el navegador no incluye path, pero a veces el valor en env
  // se guarda con slash final ("/") o con mayúsculas.
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

function parseClientOrigins(): string[] {
  const multi = process.env.CLIENT_ORIGINS;
  if (multi?.trim()) {
    return multi
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeOrigin);
  }
  // En producción exigimos origen explícito para evitar CORS permisivo accidental.
  if (isProduction && !process.env.CLIENT_ORIGIN?.trim()) {
    throw new Error("CLIENT_ORIGIN o CLIENT_ORIGINS son obligatorios en producción");
  }
  return [normalizeOrigin(process.env.CLIENT_ORIGIN ?? "http://localhost:5173")];
}

/** Sufijos HTTPS de host (p. ej. previews Vercel: `-teamslug.vercel.app`) — una URL por preview distinta. */
function parseCorsOriginSuffixes(): string[] {
  return (
    process.env.CORS_ORIGIN_SUFFIXES?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
  );
}

export const env = {
  nodeEnv: (process.env.NODE_ENV ?? "development").toLowerCase(),
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  clientOrigins: parseClientOrigins(),
  /** Orígenes https://... que terminan en uno de estos sufijos pasan CORS (útil para previews Vercel). */
  corsOriginSuffixes: parseCorsOriginSuffixes(),
  corsAllowVercelPreviews: parseBoolean(process.env.CORS_ALLOW_VERCEL_PREVIEWS, !isProduction),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: jwtSecretFromEnv || "change-this-secret-in-production",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeCurrency: (process.env.STRIPE_CURRENCY ?? "eur").toLowerCase(),
  proOneTimePriceCents: parseNumber(process.env.PRO_ONE_TIME_PRICE_CENTS, 1999),
  proTrialDays: parseNumber(process.env.PRO_TRIAL_DAYS, 30)
};

if (env.isProduction) {
  // Protección extra: bloquear configuración de CORS apuntando solo a localhost.
  const onlyLocalhostOrigins = env.clientOrigins.every((origin) =>
    origin.includes("localhost") || origin.includes("127.0.0.1")
  );
  if (onlyLocalhostOrigins) {
    throw new Error("CLIENT_ORIGIN(S) no pueden ser localhost en producción");
  }
}
