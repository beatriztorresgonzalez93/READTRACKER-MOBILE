import { env } from "../config/env";

/** Herramientas de prueba de push (simulate inactivity). Nunca activar PUSH_DEV_TOOLS en producción real. */
export function isDevPushToolsEnabled(): boolean {
  if (process.env.PUSH_DEV_TOOLS?.trim().toLowerCase() === "true") {
    return true;
  }
  return !env.isProduction;
}
