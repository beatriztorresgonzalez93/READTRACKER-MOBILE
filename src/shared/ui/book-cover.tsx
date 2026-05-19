// Componente para renderizar portada de libro con fallback (gluestack-ui).
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Box } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { APP_CARD_BG } from "@/shared/ui/app-colors";

type BookCoverProps = {
  uri?: string | null;
  /** Width in px; height follows aspectRatio */
  width?: number;
  /** height = width * aspectRatio (typical book ~1.45) */
  aspectRatio?: number;
  borderRadius?: number;
  accessibilityLabel?: string;
};

const DEFAULT_RADIUS = 6;

export function BookCover({
  uri,
  width = 72,
  aspectRatio = 1.45,
  borderRadius = DEFAULT_RADIUS,
  accessibilityLabel = "Portada del libro",
}: BookCoverProps) {
  const height = Math.round(width * aspectRatio);
  const resolved = uri?.trim() ?? "";

  if (!resolved) {
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

  return (
    <Image
      source={{ uri: resolved }}
      style={[styles.image, { width, height, borderRadius }]}
      contentFit="cover"
      transition={120}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: APP_CARD_BG,
  },
});
