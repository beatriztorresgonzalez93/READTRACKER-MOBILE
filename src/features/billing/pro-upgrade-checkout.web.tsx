import { Heading, Text, VStack } from "@gluestack-ui/themed";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useCreatePaymentIntent } from "@/features/billing/use-billing";
import { env } from "@/shared/config/env";
import { AppButton } from "@/shared/ui/app-button";

type ProUpgradeCheckoutProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

function CheckoutForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function onPayNow() {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });
      if (result.error) {
        onError(result.error.message ?? "No se pudo confirmar el pago.");
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VStack space="md">
      <PaymentElement />
      <AppButton
        label={submitting ? "Procesando..." : "Pagar y activar Pro"}
        onPress={onPayNow}
        isDisabled={submitting}
        isLoading={submitting}
      />
    </VStack>
  );
}

export function ProUpgradeCheckout({ onSuccess, onCancel }: ProUpgradeCheckoutProps) {
  const createIntent = useCreatePaymentIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!env.stripePublishableKey) return null;
    return loadStripe(env.stripePublishableKey);
  }, []);

  async function handlePreparePayment() {
    setErrorMsg(null);
    try {
      const payload = await createIntent.mutateAsync();
      setClientSecret(payload.clientSecret);
    } catch (error) {
      setErrorMsg((error as Error).message || "No se pudo preparar el pago.");
    }
  }

  return (
    <VStack space="md">
      <Heading size="lg" color="$primary800">
        Activar Scriptorium Pro
      </Heading>
      <Text size="sm" color="$textLight700" lineHeight={20}>
        Pago único: conservas la app completa para siempre (sin cuotas mensuales).
      </Text>
      {!env.stripePublishableKey ? (
        <Text size="sm" color="$error600">
          Falta EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu `.env`.
        </Text>
      ) : null}
      {errorMsg ? (
        <Text size="sm" color="$error600">
          {errorMsg}
        </Text>
      ) : null}

      {!clientSecret ? (
        <AppButton
          label="Continuar al pago"
          onPress={handlePreparePayment}
          isDisabled={createIntent.isPending}
          isLoading={createIntent.isPending}
        />
      ) : stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm onError={setErrorMsg} onSuccess={onSuccess} />
        </Elements>
      ) : null}

      <AppButton label="Cancelar" appearance="secondary" onPress={onCancel} />
    </VStack>
  );
}
