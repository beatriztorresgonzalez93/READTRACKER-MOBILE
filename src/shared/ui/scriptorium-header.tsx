// Cabecera reutilizable con titulo y accesos de navegacion.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import { useBillingStatus } from "@/features/billing/use-billing";
import { AppLink } from "@/shared/ui/app-link";
import { showNotificationsComingSoonAlert } from "@/shared/ui/placeholder-alerts";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export type ScriptoriumHeaderProps = {
  /** Mismo chrome con control para volver (stack: detalle / anadir libro). */
  showBackButton?: boolean;
};

export function ScriptoriumHeader({ showBackButton = false }: ScriptoriumHeaderProps) {
  const insets = useSafeAreaInsets();
  const appTheme = useAppTheme();
  const headerBg = appTheme.colors.bgSoft;
  const { user } = useAuth();
  const billing = useBillingStatus();
  const avatarUri = user?.avatarUrl?.trim() ? user.avatarUrl : null;

  const proChip =
    billing.status === "success" && billing.data ? (
      <Pressable
        onPress={() => router.push("/upgrade")}
        style={[
          styles.proChip,
          billing.data.needsPayment ? styles.proChipUrgent : null,
          billing.data.isPro ? styles.proChipActive : null,
        ]}
        hitSlop={8}
        accessibilityLabel="Plan Pro: prueba y compra única"
      >
        <Text style={styles.proChipText} numberOfLines={1}>
          {billing.data.isPro
            ? "Pro"
            : billing.data.needsPayment
              ? "Activar"
              : billing.data.trialActive
                ? "Prueba"
                : "Pro"}
        </Text>
      </Pressable>
    ) : null;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 6,
          // Misma tinta bajo status bar / notch que la franja del titulo (antes era transparente en nativo).
          backgroundColor: headerBg,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          { backgroundColor: headerBg, borderBottomColor: appTheme.colors.border },
        ]}
      >
        <View style={styles.row}>
        {showBackButton ? (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(app)/(tabs)/home" as never);
              }
            }}
            style={styles.leading}
            hitSlop={12}
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.brand}>
          <Text style={styles.title}>SCRIPTORIUM</Text>
          <Text style={styles.subtitle}>✦ BIBLIOTECA PERSONAL ✦</Text>
        </View>
        <View style={styles.right}>
          {proChip}
          <AppLink href={"/(app)/profile" as never} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Perfil">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Ionicons name="person-circle-outline" size={28} color={theme.colors.text} />
            )}
          </AppLink>
          <Pressable
            hitSlop={12}
            style={styles.iconBtn}
            accessibilityLabel="Notificaciones (próximamente)"
            onPress={showNotificationsComingSoonAlert}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    width: "100%",
    paddingBottom: 0,
  },
  inner: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: Platform.OS === "web" ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leading: {
    paddingVertical: 4,
    paddingRight: 6,
    marginRight: 2,
  },
  brand: {
    flex: 1,
    alignItems: "flex-start",
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    color: theme.colors.text,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.textSoft,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  proChip: {
    maxWidth: Platform.OS === "web" ? 120 : 96,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.textSoft,
    backgroundColor: theme.colors.card,
  },
  proChipUrgent: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bgSoft,
  },
  proChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.bgSoft,
  },
  proChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  iconBtn: {
    padding: 4,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.card,
  },
});
