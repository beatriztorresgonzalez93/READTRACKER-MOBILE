import { useStripe } from "@stripe/stripe-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCreatePaymentIntent } from "@/features/billing/use-billing";
import { env } from "@/shared/config/env";
import { theme } from "@/shared/ui/theme";

type ProUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProUpgradeModal({ visible, onClose, onSuccess }: ProUpgradeModalProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const createIntent = useCreatePaymentIntent();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setErrorMsg(null);
  }, [visible]);

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
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
    }
  }, [createIntent, initPaymentSheet, onClose, onSuccess, presentPaymentSheet]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
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
              Pago único con Stripe (modo prueba: usa tarjetas test en el emulador).
            </Text>
            {!env.stripePublishableKey.trim() ? (
              <Text style={styles.errorText}>Falta EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu `.env`.</Text>
            ) : null}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <Pressable
              style={[styles.primaryBtn, createIntent.isPending && styles.primaryBtnDisabled]}
              onPress={() => {
                void handleNativePay();
              }}
              disabled={createIntent.isPending || !env.stripePublishableKey.trim()}
            >
              {createIntent.isPending ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>Pagar con tarjeta (Payment Sheet)</Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={onClose}>
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
    backgroundColor: "rgba(15, 17, 21, 0.55)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    maxHeight: "85%",
  },
  scroll: {
    maxHeight: "100%",
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSoft,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
    lineHeight: 20,
  },
});
