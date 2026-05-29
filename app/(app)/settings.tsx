// Ajustes generales (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotificationPreferences } from "@/features/notifications/use-notification-preferences";
import { APP_CREAM_BG, scriptoriumColors, scriptoriumNativeHeader } from "@/shared/ui/app-colors";
import { Screen } from "@/shared/ui/screen";

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress}>
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
        <Ionicons name={icon} size={22} color="#A87D42" />
        <Text flex={1} size="md" fontWeight="$bold" color="$primary800">
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#7A6555" />
      </HStack>
    </Pressable>
  );
}

function EngagementNotificationsRow() {
  const { pushEngagementEnabled, isLoading, isSaving, togglePushEngagement, supportsPush, isExpoGo } =
    useNotificationPreferences();

  if (!supportsPush && !isExpoGo) return null;

  if (isExpoGo) {
    return (
      <Box
        bg="$backgroundLight50"
        borderRadius="$xl"
        borderWidth={1}
        borderColor="$primary200"
        py="$3.5"
        px="$3.5"
      >
        <HStack alignItems="flex-start" space="md">
          <Ionicons name="notifications-outline" size={22} color="#A87D42" />
          <VStack flex={1} space="xs">
            <Text size="md" fontWeight="$bold" color="$primary800">
              Push de re-engagement
            </Text>
            <Text size="xs" color="$textLight600" lineHeight={18}>
              En Expo Go no funcionan las push remotas (desde SDK 53). Compila la app con{" "}
              <Text fontWeight="$bold">npx expo run:android</Text> o un development build para
              probarlas. Las alarmas locales al añadir libro sí funcionan aquí.
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return (
    <Pressable
      onPress={() => void togglePushEngagement()}
      disabled={isLoading || isSaving}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: pushEngagementEnabled, disabled: isLoading || isSaving }}
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
        <VStack flex={1} space="xs">
          <Text size="md" fontWeight="$bold" color="$primary800">
            Avisos si llevo tiempo sin leer
          </Text>
          <Text size="xs" color="$textLight600" lineHeight={18}>
            El servidor puede enviarte un recordatorio si hace varios días que no abres la app (como
            en los juegos).
          </Text>
        </VStack>
        <Ionicons
          name={pushEngagementEnabled ? "checkbox" : "square-outline"}
          size={24}
          color="#2D1F15"
        />
      </HStack>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Ajustes",
      ...scriptoriumNativeHeader,
      headerStyle: { backgroundColor: APP_CREAM_BG },
      headerTitleStyle: {
        ...scriptoriumNativeHeader.headerTitleStyle,
        fontSize: 20,
      },
    });
  }, [navigation]);

  return (
    <Screen backgroundColor={APP_CREAM_BG} webBackgroundColor={APP_CREAM_BG}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="lg">
          {Platform.OS !== "web" ? (
            <Heading size="xl" color="$primary800">
              Ajustes
            </Heading>
          ) : null}
          <Text size="md" color="$textLight700" lineHeight={22}>
            Gestiona recordatorios y tu cuenta. Los avisos de inactividad requieren permiso de
            notificaciones en el móvil.
          </Text>

          <VStack space="sm">
            <EngagementNotificationsRow />
            <SettingsRow
              icon="receipt-outline"
              label="Actividad de compras"
              onPress={() => router.push("/(app)/activity" as never)}
            />
            <SettingsRow
              icon="person-outline"
              label="Ir a perfil"
              onPress={() => router.push("/(app)/profile" as never)}
            />
            <SettingsRow
              icon="sparkles-outline"
              label="Scriptorium Pro"
              onPress={() => router.push("/(app)/upgrade" as never)}
            />
          </VStack>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
