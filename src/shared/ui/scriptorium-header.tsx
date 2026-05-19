// Cabecera reutilizable con titulo y accesos de navegacion (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  HStack,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import { useBillingStatus } from "@/features/billing/use-billing";
import { AppLink } from "@/shared/ui/app-link";
import { APP_CREAM_BG } from "@/shared/ui/app-colors";
import { showNotificationsComingSoonAlert } from "@/shared/ui/placeholder-alerts";

export type ScriptoriumHeaderProps = {
  /** Mismo chrome con control para volver (stack: detalle / anadir libro). */
  showBackButton?: boolean;
};

export function ScriptoriumHeader({ showBackButton = false }: ScriptoriumHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const billing = useBillingStatus();
  const avatarUri = user?.avatarUrl?.trim() ? user.avatarUrl : null;

  const proLabel =
    billing.status === "success" && billing.data
      ? billing.data.isPro
        ? "Pro"
        : billing.data.needsPayment
          ? "Activar"
          : billing.data.trialActive
            ? "Prueba"
            : "Pro"
      : null;

  const proChipUrgent =
    billing.status === "success" && billing.data?.needsPayment && !billing.data.isPro;
  const proChipActive = billing.status === "success" && billing.data?.isPro;

  return (
    <Box
      w="100%"
      maxWidth={1120}
      alignSelf="center"
      bg={APP_CREAM_BG}
      pt={insets.top + 6}
      pb={0}
    >
      <Box
        w="100%"
        px="$4"
        pb="$2"
        borderBottomWidth={Platform.OS === "web" ? 0 : 1}
        borderBottomColor="$primary200"
      >
        <HStack alignItems="center" justifyContent="space-between">
          {showBackButton ? (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(app)/(tabs)/home" as never);
                }
              }}
              hitSlop={12}
              pr="$1.5"
              mr="$0.5"
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={28} color="#2D1F15" />
            </Pressable>
          ) : null}

          <VStack flex={1} alignItems="flex-start" minWidth={0} pr="$2">
            <Text
              fontFamily="Fraunces_700Bold"
              size="lg"
              color="$primary800"
              letterSpacing={1.2}
            >
              SCRIPTORIUM
            </Text>
            <Text
              size="2xs"
              letterSpacing={2}
              fontFamily="Fraunces_400Regular"
              color="$textLight500"
              mt="$0.5"
            >
              ✦ BIBLIOTECA PERSONAL ✦
            </Text>
          </VStack>

          <HStack alignItems="center" space="sm" flexShrink={0}>
            {proLabel ? (
              <Pressable
                onPress={() => router.push("/upgrade" as never)}
                hitSlop={8}
                accessibilityLabel="Plan Pro: prueba y compra única"
              >
                <Box
                  maxWidth={Platform.OS === "web" ? 120 : 96}
                  px="$2.5"
                  py="$1.5"
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor={
                    proChipActive ? "$primary400" : proChipUrgent ? "$primary500" : "$primary200"
                  }
                  bg={proChipUrgent || proChipActive ? "$primary100" : "$backgroundLight50"}
                >
                  <Text size="xs" fontWeight="$bold" color="$primary800" textAlign="center" numberOfLines={1}>
                    {proLabel}
                  </Text>
                </Box>
              </Pressable>
            ) : null}

            <AppLink
              href={"/(app)/profile" as never}
              hitSlop={12}
              accessibilityLabel="Perfil"
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color="#2D1F15" />
              )}
            </AppLink>

            <Pressable
              hitSlop={12}
              p="$1"
              accessibilityLabel="Notificaciones (próximamente)"
              onPress={showNotificationsComingSoonAlert}
            >
              <Ionicons name="notifications-outline" size={24} color="#2D1F15" />
            </Pressable>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2D1F15",
    backgroundColor: "#FFFCF5",
  },
});
