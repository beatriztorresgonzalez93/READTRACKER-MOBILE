import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useCreatePaymentIntent } from "@/features/billing/use-billing";
import { env } from "@/shared/config/env";
import { theme } from "@/shared/ui/theme";

type ProUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function CheckoutForm({
  onSuccess,
  onError
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
        confirmParams: { return_url: window.location.href }
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
    <View style={styles.checkoutWrap}>
      <PaymentElement />
      <Pressable style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]} onPress={onPayNow}>
        <Text style={styles.primaryBtnText}>{submitting ? "Procesando..." : "Pagar y activar Pro"}</Text>
      </Pressable>
    </View>
  );
}

export function ProUpgradeModal({ visible, onClose, onSuccess }: ProUpgradeModalProps) {
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

  function handleClose() {
    setClientSecret(null);
    setErrorMsg(null);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Activar Scriptorium Pro</Text>
            <Text style={styles.subtitle}>
              Pago único: conservas la app completa para siempre (sin cuotas mensuales).
            </Text>
            {!env.stripePublishableKey ? (
              <Text style={styles.errorText}>Falta EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu `.env`.</Text>
            ) : null}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {!clientSecret ? (
              <Pressable style={styles.primaryBtn} onPress={handlePreparePayment}>
                {createIntent.isPending ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>Continuar al pago</Text>
                )}
              </Pressable>
            ) : stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  onError={setErrorMsg}
                  onSuccess={() => {
                    onSuccess();
                    handleClose();
                  }}
                />
              </Elements>
            ) : null}

            <Pressable style={styles.secondaryBtn} onPress={handleClose}>
              <Text style={styles.secondaryBtnText}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16
  },
  card: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: theme.colors.text
  },
  subtitle: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    color: theme.colors.textSoft
  },
  errorText: {
    color: "#B42318",
    fontSize: 13
  },
  checkoutWrap: {
    gap: 10
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryBtnDisabled: {
    opacity: 0.7
  },
  primaryBtnText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 15
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold"
  }
});
