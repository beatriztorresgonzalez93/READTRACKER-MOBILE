// Registra redirección a /upgrade cuando apiRequest recibe 402 SUBSCRIPTION_REQUIRED.
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";

import { setSubscriptionRequiredHandler } from "@/shared/api/subscription-required";

export function SubscriptionRequiredBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    setSubscriptionRequiredHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
      router.replace("/upgrade" as never);
    });
    return () => setSubscriptionRequiredHandler(null);
  }, [queryClient]);

  return null;
}
