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
            Aquí irán preferencias avanzadas (notificaciones, apariencia, etc.). De momento puedes
            gestionar tu cuenta desde Perfil o activar Pro.
          </Text>

          <VStack space="sm">
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
