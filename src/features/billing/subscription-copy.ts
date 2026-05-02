import { env } from "@/shared/config/env";

export function trialDaysLabel(): string {
  const n = env.proTrialDays;
  return n === 1 ? "1 día" : `${n} días`;
}

export const subscriptionCopy = {
  trialLead: `Prueba gratuita de ${trialDaysLabel()}: acceso completo a la app. Después puedes activar Pro con un solo pago y conservarla para siempre, como una licencia de por vida.`,
  trialShort: `Incluye ${trialDaysLabel()} de prueba gratuita al crear cuenta.`,
  proTitle: "Scriptorium Pro",
  proSubtitle: "Un solo pago. Tuya para siempre. Sin suscripción.",
  proBenefits:
    "Desbloqueas la app completa de forma permanente: biblioteca, lectura, estadísticas y todo lo que añadamos en Pro.",
  nativePayHint:
    "El pago con tarjeta en la app móvil se completa en la versión web por seguridad. Usa la misma cuenta.",
} as const;
