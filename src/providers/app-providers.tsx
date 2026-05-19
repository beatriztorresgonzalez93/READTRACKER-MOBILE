// Agrupa providers globales: gluestack-ui, React Query y autenticacion.
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AuthProvider } from "@/features/auth/auth-context";
import { StripeAppProvider } from "@/providers/stripe-app-provider";
import { appGluestackConfig } from "@/shared/ui/gluestack-config";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <GluestackUIProvider config={appGluestackConfig}>
      <QueryClientProvider client={queryClient}>
        <StripeAppProvider>
          <AuthProvider>{children}</AuthProvider>
        </StripeAppProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
