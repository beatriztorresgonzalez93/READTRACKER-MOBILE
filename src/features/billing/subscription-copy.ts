import { env } from "@/shared/config/env";

export function trialDaysLabel(): string {
  const n = env.proTrialDays;
  return n === 1 ? "1 día" : `${n} días`;
}

export const subscriptionCopy = {
  trialLead: `Prueba gratuita de ${trialDaysLabel()}: acceso completo. Después puedes activar Pro con un pago único para seguir con estadísticas avanzadas.`,
  trialShort: `Incluye ${trialDaysLabel()} de prueba gratuita al crear cuenta.`,
  proTitle: "Scriptorium Pro",
  proSubtitle: "Pago único. Sin suscripción mensual.",
  proBenefitStats: "Estadísticas avanzadas de lectura tras la prueba.",
  nativePayHint:
    "El pago con tarjeta en la app móvil se completa en la versión web por seguridad. Usa la misma cuenta.",
} as const;
