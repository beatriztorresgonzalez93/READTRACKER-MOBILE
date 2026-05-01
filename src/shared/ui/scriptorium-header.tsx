// Cabecera reutilizable con titulo y accesos de navegacion.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import { theme } from "@/shared/ui/theme";

export type ScriptoriumHeaderProps = {
  /** Mismo chrome con control para volver (stack: detalle / anadir libro). */
  showBackButton?: boolean;
};

export function ScriptoriumHeader({ showBackButton = false }: ScriptoriumHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUri = user?.avatarUrl?.trim() ? user.avatarUrl : null;
  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.inner}>
        <View style={styles.row}>
        {showBackButton ? (
          <Pressable onPress={() => router.back()} style={styles.leading} hitSlop={12} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={28} color={theme.colors.accent} />
          </Pressable>
        ) : null}
        <View style={styles.brand}>
          <Text style={styles.title}>SCRIPTORIUM</Text>
          <Text style={styles.subtitle}>✦ BIBLIOTECA PERSONAL ✦</Text>
        </View>
        <View style={styles.right}>
          <Link href={"/(app)/profile" as never} asChild>
            <Pressable hitSlop={12} style={styles.iconBtn} accessibilityLabel="Perfil">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color={theme.colors.accent} />
              )}
            </Pressable>
          </Link>
          <Pressable
            hitSlop={12}
            style={styles.iconBtn}
            accessibilityLabel="Avisos"
            onPress={() =>
              Alert.alert("Proximamente", "Funcionalidad disponible en la siguiente iteracion.")
            }
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.accent} />
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
    backgroundColor:
      Platform.OS === "web" ? theme.colors.cardElevated : "transparent",
  },
  inner: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: theme.colors.bgPanel,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    color: theme.colors.accent,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.textMutedOnDark,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.card,
  },
});
