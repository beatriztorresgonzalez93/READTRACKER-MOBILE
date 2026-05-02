import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import { createBillingPaymentIntent, getBillingStatus } from "@/shared/api/billing-api";

export function useBillingStatus() {
  const { token, isAuthenticated } = useAuth();
  const tokenReady = Boolean(token?.trim());
  return useQuery({
    queryKey: ["billing", "status", token],
    queryFn: () => getBillingStatus(token as string),
    enabled: isAuthenticated && tokenReady,
    retry: 2,
    staleTime: 60_000
  });
}

export function useCreatePaymentIntent() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Sesión no disponible");
      return createBillingPaymentIntent(token);
    }
  });
}

export function useRefreshBillingStatus() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return () => queryClient.invalidateQueries({ queryKey: ["billing", "status", token] });
}
