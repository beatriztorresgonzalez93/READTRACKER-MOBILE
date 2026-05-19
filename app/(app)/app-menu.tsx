// Menú rápido desde el icono de ajustes en la cabecera de pestañas (gluestack-ui).
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
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo } from "react";
import { Platform, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOOK_SHEET_BG } from "@/features/books/book-sheet-ui";
import { env } from "@/shared/config/env";

type MenuRow = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function MenuRowCard({ row }: { row: MenuRow }) {
  return (
    <Pressable onPress={row.onPress}>
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
        <Box
          w={44}
          h={44}
          borderRadius="$lg"
          bg="$primary100"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name={row.icon} size={22} color="#A87D42" />
        </Box>
        <VStack flex={1} space="xs">
          <Text size="md" fontWeight="$bold" color="$primary800">
            {row.label}
          </Text>
          {row.subtitle ? (
            <Text size="sm" color="$textLight500">
              {row.subtitle}
            </Text>
          ) : null}
        </VStack>
        <Ionicons name="chevron-forward" size={20} color="#7A6555" />
      </HStack>
    </Pressable>
  );
}

export default function AppMenuScreen() {
  const insets = useSafeAreaInsets();

  const rows = useMemo<MenuRow[]>(
    () => [
      {
        key: "activity",
        label: "Actividad de compras",
        subtitle: "Historial de libros comprados desde la wishlist",
        icon: "receipt-outline",
        onPress: () => router.push("/(app)/activity" as never),
      },
      {
        key: "profile",
        label: "Perfil",
        subtitle: "Nombre, foto y correo",
        icon: "person-circle-outline",
        onPress: () => router.push("/(app)/profile" as never),
      },
      {
        key: "settings",
        label: "Ajustes",
        subtitle: "Preferencias de la app",
        icon: "settings-outline",
        onPress: () => router.push("/(app)/settings" as never),
      },
      {
        key: "upgrade",
        label: "Scriptorium Pro",
        subtitle: "Activar plan o ver beneficios",
        icon: "sparkles-outline",
        onPress: () => router.push("/(app)/upgrade" as never),
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
    (Constants as unknown as { manifest?: { version?: string } }).manifest?.version ??
    "1.0.0";

  return (
    <Box flex={1} bg={BOOK_SHEET_BG}>
      <HStack
        alignItems="center"
        justifyContent="space-between"
        px="$5"
        pt={insets.top + 8}
        pb="$3"
      >
        <Heading size="xl" color="$primary800">
          Más
        </Heading>
        <Pressable
          accessibilityLabel="Cerrar menú"
          hitSlop={12}
          onPress={() => router.back()}
          p="$1"
        >
          <Ionicons name="close" size={28} color="#2D1F15" />
        </Pressable>
      </HStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32 + insets.bottom,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="sm">
          {rows.map((row) => (
            <MenuRowCard key={row.key} row={row} />
          ))}
        </VStack>
        <Text size="xs" color="$textLight500" textAlign="center" mt="$6">
          Versión {version}
        </Text>
      </ScrollView>
    </Box>
  );
}
