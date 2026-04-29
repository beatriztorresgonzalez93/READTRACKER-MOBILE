// Cabecera reutilizable con titulo y accesos de navegacion.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/shared/ui/theme";

export type ScriptoriumHeaderProps = {
  /** Mismo chrome con control para volver (stack: detalle / anadir libro). */
  showBackButton?: boolean;
};

export function ScriptoriumHeader({ showBackButton = false }: ScriptoriumHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        {showBackButton ? (
          <Pressable onPress={() => router.back()} style={styles.leading} hitSlop={12} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={28} color={theme.colors.accent} />
          </Pressable>
        ) : null}
        <View style={styles.brand}>
          <Text style={styles.title}>SCRIPTORIUM</Text>
          <Text style={styles.subtitle}>BIBLIOTECA PERSONAL</Text>
        </View>
        <View style={styles.right}>
          <Link href={"/(app)/profile" as never} asChild>
            <Pressable hitSlop={12} style={styles.iconBtn} accessibilityLabel="Perfil">
              <Ionicons name="person-circle-outline" size={28} color={theme.colors.accent} />
            </Pressable>
          </Link>
          <Pressable hitSlop={12} style={styles.iconBtn} accessibilityLabel="Avisos">
            <Ionicons name="notifications-outline" size={24} color={theme.colors.accent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
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
});
