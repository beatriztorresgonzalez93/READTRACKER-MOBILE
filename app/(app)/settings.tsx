// Ajustes generales (enlace desde el menú "Más").
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const appTheme = useAppTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Ajustes",
      headerStyle: { backgroundColor: appTheme.colors.bgSoft },
      headerTintColor: appTheme.colors.primary,
      headerTitleStyle: {
        fontFamily: "Fraunces_700Bold",
        fontSize: 20,
        color: appTheme.colors.text,
      },
      headerShadowVisible: false,
    });
  }, [navigation, appTheme.colors]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: appTheme.colors.bgSoft }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32 + insets.bottom,
        gap: 12,
      }}
    >
        <Text style={[styles.lead, { color: appTheme.colors.textSoft }]}>
          Aquí irán preferencias avanzadas (notificaciones, apariencia, etc.). De momento puedes
          gestionar tu cuenta desde Perfil o activar Pro.
        </Text>

        <Pressable
          onPress={() => router.push("/(app)/activity" as never)}
          style={[
            styles.row,
            {
              backgroundColor: appTheme.colors.card,
              borderColor: appTheme.colors.borderOnCard,
            },
          ]}
        >
          <Ionicons name="receipt-outline" size={22} color={appTheme.colors.primary} />
          <Text style={[styles.rowLabel, { color: appTheme.colors.text }]}>
            Actividad de compras
          </Text>
          <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMutedOnDark} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(app)/profile" as never)}
          style={[
            styles.row,
            {
              backgroundColor: appTheme.colors.card,
              borderColor: appTheme.colors.borderOnCard,
            },
          ]}
        >
          <Ionicons name="person-outline" size={22} color={appTheme.colors.primary} />
          <Text style={[styles.rowLabel, { color: appTheme.colors.text }]}>Ir a perfil</Text>
          <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMutedOnDark} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(app)/upgrade" as never)}
          style={[
            styles.row,
            {
              backgroundColor: appTheme.colors.card,
              borderColor: appTheme.colors.borderOnCard,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={22} color={appTheme.colors.primary} />
          <Text style={[styles.rowLabel, { color: appTheme.colors.text }]}>Scriptorium Pro</Text>
          <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMutedOnDark} />
        </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
});
