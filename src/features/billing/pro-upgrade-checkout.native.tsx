import { Heading, Text, VStack } from "@gluestack-ui/themed";
import { useStripe } from "@stripe/stripe-react-native";
import { useCallback, useState } from "react";

import { useCreatePaymentIntent } from "@/features/billing/use-billing";
import { env } from "@/shared/config/env";
import { AppButton } from "@/shared/ui/app-button";

type ProUpgradeCheckoutProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function ProUpgradeCheckout({ onSuccess, onCancel }: ProUpgradeCheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const createIntent = useCreatePaymentIntent();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNativePay = useCallback(async () => {
    setErrorMsg(null);
    try {
      const payload = await createIntent.mutateAsync();
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Scriptorium",
        paymentIntentClientSecret: payload.clientSecret,
        allowsDelayedPaymentMethods: false,
      });
      if (initError) {
        setErrorMsg(initError.message);
        return;
      }
      const { error: sheetError } = await presentPaymentSheet();
      if (sheetError) {
        if (sheetError.code === "Canceled") return;
        setErrorMsg(sheetError.message ?? "No se pudo completar el pago.");
        return;
      }
      onSuccess();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
    }
  }, [createIntent, initPaymentSheet, onSuccess, presentPaymentSheet]);

  return (
    <VStack space="md">
      <Heading size="lg" color="$primary800">
        Activar Scriptorium Pro
      </Heading>
      <Text size="sm" color="$textLight700" lineHeight={20}>
        Pago único con Stripe (modo prueba: usa tarjetas test en el emulador).
      </Text>
      {!env.stripePublishableKey.trim() ? (
        <Text size="sm" color="$error600">
          Falta EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu `.env`.
        </Text>
      ) : null}
      {errorMsg ? (
        <Text size="sm" color="$error600">
          {errorMsg}
        </Text>
      ) : null}

      <AppButton
        label="Pagar con tarjeta (Payment Sheet)"
        onPress={() => void handleNativePay()}
        isDisabled={createIntent.isPending || !env.stripePublishableKey.trim()}
        isLoading={createIntent.isPending}
      />

      <AppButton label="Cancelar" appearance="secondary" onPress={onCancel} />
    </VStack>
  );
}
