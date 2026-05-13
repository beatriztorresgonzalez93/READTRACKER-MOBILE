// Menú rápido desde el icono de ajustes en la cabecera de pestañas (móvil).
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { env } from "@/shared/config/env";
import { useAppTheme } from "@/shared/ui/use-app-theme";

type MenuRow = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function AppMenuScreen() {
  const insets = useSafeAreaInsets();
  const appTheme = useAppTheme();

  const rows = useMemo<MenuRow[]>(
    () => [
      {
        key: "activity",
        label: "Actividad de compras",
        subtitle: "Historial de libros comprados desde la wishlist",
        icon: "receipt-outline",
        onPress: () => {
          router.push("/(app)/activity" as never);
        },
      },
      {
        key: "profile",
        label: "Perfil",
        subtitle: "Nombre, foto y correo",
        icon: "person-circle-outline",
        onPress: () => {
          router.push("/(app)/profile" as never);
        },
      },
      {
        key: "settings",
        label: "Ajustes",
        subtitle: "Preferencias de la app",
        icon: "settings-outline",
        onPress: () => {
          router.push("/(app)/settings" as never);
        },
      },
      {
        key: "upgrade",
        label: "Scriptorium Pro",
        subtitle: "Activar plan o ver beneficios",
        icon: "sparkles-outline",
        onPress: () => {
          router.push("/(app)/upgrade" as never);
        },
      },
      {
        key: "share",
        label: "Compartir la app",
        subtitle: "Invita a otras lectoras",
        icon: "share-outline",
        onPress: async () => {
          const origin = env.webAppOrigin.trim();
          const link = origin || "readtrackermobile://";
          try {
            await Share.share({
              title: "Scriptorium",
              message: `Te recomiendo Scriptorium para llevar tu biblioteca.\n${link}`,
              ...(Platform.OS === "web" && origin ? { url: origin } : {}),
            });
          } catch {
            /* usuario canceló */
          }
        },
      },
    ],
    [],
  );

  const version =
    Constants.expoConfig?.version ??
    (Constants as unknown as { manifest?: { version?: string } }).manifest
      ?.version ??
    "1.0.0";

  return (
    <View style={[styles.root, { backgroundColor: appTheme.colors.bgSoft }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: appTheme.colors.text }]}>Más</Text>
        <Pressable
          accessibilityLabel="Cerrar menú"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={28} color={appTheme.colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <Pressable
            key={row.key}
            onPress={row.onPress}
            style={[
              styles.row,
              {
                backgroundColor: appTheme.colors.card,
                borderColor: appTheme.colors.borderOnCard,
              },
            ]}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: appTheme.colors.bgPanel }]}>
              <Ionicons name={row.icon} size={22} color={appTheme.colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: appTheme.colors.text }]}>
                {row.label}
              </Text>
              {row.subtitle ? (
                <Text style={[styles.rowSub, { color: appTheme.colors.textSoft }]}>
                  {row.subtitle}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMutedOnDark} />
          </Pressable>
        ))}

        <Text style={[styles.version, { color: appTheme.colors.textMutedOnDark }]}>
          Versión {version}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 26,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  rowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  rowSub: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
  },
  version: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    fontFamily: "Fraunces_400Regular",
  },
});
