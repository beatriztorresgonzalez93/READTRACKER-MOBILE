// Componente para renderizar portada de libro con fallback (gluestack-ui).
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Box, Text } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import {
  coverPaletteFromTitle,
  coverTitleLines,
  shouldPreferTitlePlaceholder,
} from "@/shared/lib/book-cover-placeholder";
import { APP_CARD_BG } from "@/shared/ui/app-colors";

type BookCoverProps = {
  uri?: string | null;
  /** Si la imagen falla o no hay URL, muestra color + título */
  title?: string | null;
  /** Width in px; height follows aspectRatio */
  width?: number;
  /** height = width * aspectRatio (typical book ~1.45) */
  aspectRatio?: number;
  borderRadius?: number;
  accessibilityLabel?: string;
};

const DEFAULT_RADIUS = 6;

function TitlePlaceholderCover({
  title,
  width,
  height,
  borderRadius,
  accessibilityLabel,
}: {
  title: string;
  width: number;
  height: number;
  borderRadius: number;
  accessibilityLabel: string;
}) {
  const palette = coverPaletteFromTitle(title);
  const fontSize = width < 56 ? 9 : width < 80 ? 10 : width < 120 ? 11 : 12;
  const lineHeight = fontSize + 3;

  return (
    <Box
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={{ backgroundColor: palette.backgroundColor }}
      borderWidth={1}
      borderColor="$primary200"
      alignItems="center"
      justifyContent="center"
      px="$1.5"
      py="$2"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Text
        style={{ color: palette.color, fontSize, lineHeight, fontWeight: "700", textAlign: "center" }}
        numberOfLines={5}
      >
        {coverTitleLines(title)}
      </Text>
    </Box>
  );
}

function IconPlaceholderCover({
  width,
  height,
  borderRadius,
  accessibilityLabel,
}: {
  width: number;
  height: number;
  borderRadius: number;
  accessibilityLabel: string;
}) {
  return (
    <Box
      width={width}
      height={height}
      borderRadius={borderRadius}
      bg="$primary100"
      borderWidth={1}
      borderColor="$primary200"
      alignItems="center"
      justifyContent="center"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <MaterialCommunityIcons
        name="book-outline"
        size={Math.min(width, height) * 0.4}
        color="#7A6555"
      />
    </Box>
  );
}

export function BookCover({
  uri,
  title,
  width = 72,
  aspectRatio = 1.45,
  borderRadius = DEFAULT_RADIUS,
  accessibilityLabel = "Portada del libro",
}: BookCoverProps) {
  const height = Math.round(width * aspectRatio);
  const resolved = uri?.trim() ?? "";
  const titleTrimmed = title?.trim() ?? "";
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [resolved]);

  const skipRemoteImage =
    !resolved || imageError || shouldPreferTitlePlaceholder(resolved);

  if (skipRemoteImage) {
    if (titleTrimmed) {
      return (
        <TitlePlaceholderCover
          title={titleTrimmed}
          width={width}
          height={height}
          borderRadius={borderRadius}
          accessibilityLabel={accessibilityLabel}
        />
      );
    }
    return (
      <IconPlaceholderCover
        width={width}
        height={height}
        borderRadius={borderRadius}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={[styles.image, { width, height, borderRadius }]}
      contentFit="cover"
      transition={120}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: APP_CARD_BG,
  },
});
