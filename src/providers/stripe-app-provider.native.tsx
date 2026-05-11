import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import type { ReactElement } from "react";

import { env } from "@/shared/config/env";

function resolveUrlScheme(): string | undefined {
  const scheme = Constants.expoConfig?.scheme;
  if (typeof scheme === "string") return scheme;
  if (Array.isArray(scheme) && scheme.length > 0) return scheme[0];
  return undefined;
}

export function StripeAppProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = env.stripePublishableKey.trim();
  if (!publishableKey) {
    return children;
  }
  const stripeChildren = children as ReactElement | ReactElement[];
  return (
    <StripeProvider publishableKey={publishableKey} urlScheme={resolveUrlScheme()}>
      {stripeChildren}
    </StripeProvider>
  );
}
