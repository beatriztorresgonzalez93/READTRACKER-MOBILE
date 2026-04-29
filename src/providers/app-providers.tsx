import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";

import { AuthProvider } from "@/features/auth/auth-context";
import { createPaperTheme } from "@/shared/ui/paper-theme";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
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
  const paperTheme = useMemo(() => createPaperTheme(colorScheme), [colorScheme]);

  return (
    <PaperProvider theme={paperTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}

