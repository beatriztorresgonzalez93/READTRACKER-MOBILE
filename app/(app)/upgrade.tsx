// Pantalla Plan Pro: estado de trial, activación y pago (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";

import { useAuth } from "@/features/auth/use-auth";
import { BOOK_SHEET_BG } from "@/features/books/book-sheet-ui";
import { DetailCard } from "@/features/books/book-detail-ui";
import { subscriptionCopy } from "@/features/billing/subscription-copy";
import { useBillingStatus } from "@/features/billing/use-billing";
import { AppButton } from "@/shared/ui/app-button";
import { AppLoader } from "@/shared/ui/app-loader";
import { showLegalDocsComingSoonAlert } from "@/shared/ui/placeholder-alerts";
import { Screen } from "@/shared/ui/screen";

export default function UpgradeScreen() {
  const { token, isAuthenticated, isBootstrapping } = useAuth();
  const billingCanFetch = !isBootstrapping && isAuthenticated && Boolean(token?.trim());
  const billing = useBillingStatus();

  if (
    !billingCanFetch ||
    (billingCanFetch && billing.status !== "success" && billing.status !== "error")
  ) {
    return (
      <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
        <AppLoader />
      </Screen>
    );
  }

  if (billing.status === "error") {
    return (
      <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG} style={{ padding: 16 }}>
        <Text size="md" color="$error600">
          {billing.error instanceof Error ? billing.error.message : "No se pudo cargar tu plan."}
        </Text>
      </Screen>
    );
  }

  if (!billing.data) {
    return (
      <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
        <AppLoader />
      </Screen>
    );
  }

  const { isPro, trialActive, trialEndsAt, proActivatedAt } = billing.data;

  const trialEndLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          <VStack alignItems="center" space="sm">
            <Ionicons name="sparkles" size={28} color="#A87D42" />
            <Heading size="xl" color="$primary800" textAlign="center">
              {subscriptionCopy.proTitle}
            </Heading>
            <Text size="sm" color="$textLight700" textAlign="center">
              {subscriptionCopy.proSubtitle}
            </Text>
          </VStack>

          <DetailCard>
            <Text size="md" fontWeight="$bold" color="$primary800" mb="$2">
              Tu situación
            </Text>
            {isPro ? (
              <Text size="md" color="$primary800" lineHeight={22}>
                Tienes Pro activo
                {proActivatedAt
                  ? ` desde ${new Date(proActivatedAt).toLocaleDateString("es-ES")}.`
                  : "."}
              </Text>
            ) : trialActive ? (
              <Text size="md" color="$primary800" lineHeight={22}>
                Estás en periodo de prueba gratuita.
                {trialEndLabel ? `\nLa prueba termina el ${trialEndLabel}.` : ""}
              </Text>
            ) : (
              <Text size="md" color="$primary800" lineHeight={22}>
                La prueba ha terminado. Activa Pro con un solo pago para seguir usando la app al
                completo, sin límites de tiempo ni cuotas mensuales.
              </Text>
            )}
          </DetailCard>

          <DetailCard>
            <Text size="md" fontWeight="$bold" color="$primary800" mb="$2">
              Qué incluye Pro
            </Text>
            <Text size="md" color="$primary800" lineHeight={22}>
              {subscriptionCopy.proBenefits}
            </Text>
            <Text size="sm" color="$textLight500" mt="$2" lineHeight={20}>
              {subscriptionCopy.trialLead}
            </Text>
          </DetailCard>

          {!isPro ? (
            <AppButton
              label="Ver opciones de pago"
              onPress={() => router.push("/(app)/upgrade/checkout" as never)}
            />
          ) : (
            <HStack justifyContent="center" alignItems="center" space="sm" py="$3">
              <Ionicons name="checkmark-circle" size={20} color="#A87D42" />
              <Text size="md" fontWeight="$bold" color="$primary800">
                Plan activo
              </Text>
            </HStack>
          )}

          <Pressable
            alignSelf="center"
            onPress={showLegalDocsComingSoonAlert}
            accessibilityRole="button"
            accessibilityLabel="Condiciones de uso y privacidad, próximamente"
          >
            <Text size="sm" fontWeight="$bold" color="$primary600" textDecorationLine="underline">
              Condiciones y privacidad (próximamente)
            </Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
