// Ajustes: preferencias de notificaciones.
import { Ionicons } from "@expo/vector-icons";
import { Heading, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { Platform, StyleSheet } from "react-native";

import { useDailyReadingReminder } from "@/features/notifications/use-daily-reading-reminder";
import { APP_CREAM_BG } from "@/shared/ui/app-colors";
import { Screen } from "@/shared/ui/screen";

function NotificationsToggleRow() {
  const { enabled, isLoading, isSaving, toggle, supportsLocal } = useDailyReadingReminder();

  if (!supportsLocal) return null;

  return (
    <Pressable
      onPress={() => void toggle()}
      disabled={isLoading || isSaving}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: enabled, disabled: isLoading || isSaving }}
      accessibilityLabel="Recibir notificaciones"
    >
      <HStack
        alignItems="center"
        space="md"
        bg="$backgroundLight50"
        borderRadius="$xl"
        borderWidth={1}
        borderColor="$primary200"
        py="$3.5"
        px="$3.5"
      >
        <Ionicons name="notifications-outline" size={22} color="#A87D42" />
        <Text flex={1} size="md" fontWeight="$bold" color="$primary800">
          Recibir notificaciones
        </Text>
        <Ionicons
          name={enabled ? "checkbox" : "square-outline"}
          size={24}
          color="#2D1F15"
        />
      </HStack>
    </Pressable>
  );
}

export default function SettingsScreen() {
  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor={APP_CREAM_BG}
      webBackgroundColor={APP_CREAM_BG}
      style={styles.screen}
    >
      {Platform.OS === "web" ? (
        <Heading size="xl" color="$primary800" mb="$3">
          Notificaciones
        </Heading>
      ) : null}
      <Text size="sm" color="$textLight700" lineHeight={20} mb="$4">
        Al iniciar sesión te pedimos permiso para notificaciones; aquí puedes desactivarlos.
      </Text>

      <NotificationsToggleRow />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
