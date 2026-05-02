// Pantalla Plan Pro: estado de trial, activación y pago (Stripe en web).
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { ProUpgradeModal } from "@/features/billing/pro-upgrade-modal";
import { subscriptionCopy } from "@/features/billing/subscription-copy";
import { useBillingStatus, useRefreshBillingStatus } from "@/features/billing/use-billing";
import { env } from "@/shared/config/env";
import { AppLoader } from "@/shared/ui/app-loader";
import { showLegalDocsComingSoonAlert } from "@/shared/ui/placeholder-alerts";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function UpgradeScreen() {
  const { token, isAuthenticated, isBootstrapping } = useAuth();
  const billingCanFetch = !isBootstrapping && isAuthenticated && Boolean(token?.trim());
  const billing = useBillingStatus();
  const refreshBilling = useRefreshBillingStatus();
  const [modalOpen, setModalOpen] = useState(false);

  if (
    !billingCanFetch ||
    (billingCanFetch && billing.status !== "success" && billing.status !== "error")
  ) {
    return (
      <Screen style={styles.screen}>
        <AppLoader />
      </Screen>
    );
  }

  if (billing.status === "error") {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.errorText}>
          {billing.error instanceof Error ? billing.error.message : "No se pudo cargar tu plan."}
        </Text>
      </Screen>
    );
  }

  if (!billing.data) {
    return (
      <Screen style={styles.screen}>
        <AppLoader />
      </Screen>
    );
  }

  const { isPro, trialActive, needsPayment, trialEndsAt, proActivatedAt } = billing.data;

  async function openWebCheckout() {
    if (!env.webAppOrigin) {
      Alert.alert(
        "Configuración necesaria",
        "Añade EXPO_PUBLIC_WEB_APP_ORIGIN en tu build (URL de la web en Vercel) para abrir el pago en el navegador.",
      );
      return;
    }
    const url = `${env.webAppOrigin}/upgrade`;
    Alert.alert(
      "Continuar en la web",
      `${subscriptionCopy.nativePayHint}\n\nSe abrirá tu navegador.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Abrir",
          onPress: () => {
            void WebBrowser.openBrowserAsync(url);
          },
        },
      ],
    );
  }

  const trialEndLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="sparkles" size={28} color={theme.colors.primary} />
          <Text style={styles.heroTitle}>{subscriptionCopy.proTitle}</Text>
          <Text style={styles.heroSubtitle}>{subscriptionCopy.proSubtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu situación</Text>
          {isPro ? (
            <Text style={styles.cardBody}>
              Tienes Pro activo
              {proActivatedAt
                ? ` desde ${new Date(proActivatedAt).toLocaleDateString("es-ES")}.`
                : "."}
            </Text>
          ) : trialActive ? (
            <Text style={styles.cardBody}>
              Estás en periodo de prueba gratuita.
              {trialEndLabel ? `\nLa prueba termina el ${trialEndLabel}.` : ""}
            </Text>
          ) : (
            <Text style={styles.cardBody}>
              La prueba ha terminado. Activa Pro con un solo pago para seguir usando la app al completo,
              sin límites de tiempo ni cuotas mensuales.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Qué incluye Pro</Text>
          <Text style={styles.cardBody}>{subscriptionCopy.proBenefits}</Text>
          <Text style={styles.cardMuted}>{subscriptionCopy.trialLead}</Text>
        </View>

        {!isPro ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              if (Platform.OS === "web") {
                setModalOpen(true);
              } else {
                void openWebCheckout();
              }
            }}
          >
            <Text style={styles.primaryBtnText}>
              {needsPayment ? "Activar Pro con tarjeta" : "Ver opción de pago Pro"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.donePill}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.donePillText}>Plan activo</Text>
          </View>
        )}

        {Platform.OS !== "web" && !isPro ? (
          <Text style={styles.footnote}>
            En el móvil el cobro se hace en la web por seguridad (Stripe).{" "}
            {env.webAppOrigin ? `URL: ${env.webAppOrigin}/upgrade` : "Configura EXPO_PUBLIC_WEB_APP_ORIGIN."}
          </Text>
        ) : null}

        <Pressable
          style={styles.legalFootnote}
          onPress={showLegalDocsComingSoonAlert}
          accessibilityRole="button"
          accessibilityLabel="Condiciones de uso y privacidad, próximamente"
        >
          <Text style={styles.legalFootnoteText}>Condiciones y privacidad (próximamente)</Text>
        </Pressable>
      </ScrollView>

      <ProUpgradeModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshBilling();
          setModalOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  scroll: {
    gap: 14,
    paddingBottom: 32,
  },
  hero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 26,
    color: theme.colors.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    color: theme.colors.textSoft,
    textAlign: "center",
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: theme.colors.text,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  cardMuted: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSoft,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  donePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  donePillText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
    color: theme.colors.text,
  },
  footnote: {
    fontSize: 12,
    color: theme.colors.textSoft,
    textAlign: "center",
    lineHeight: 18,
  },
  legalFootnote: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  legalFootnoteText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  errorText: {
    color: "#B42318",
    padding: 16,
  },
});
