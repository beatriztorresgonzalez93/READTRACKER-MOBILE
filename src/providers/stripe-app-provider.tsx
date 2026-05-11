// Web: Stripe RN no aplica; el checkout usa Elements en `pro-upgrade-modal.web.tsx`.
export function StripeAppProvider({ children }: { children: React.ReactNode }) {
  return children;
}
