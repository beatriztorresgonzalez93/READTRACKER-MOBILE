import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { theme } from "@/shared/ui/theme";

type BookCoverProps = {
  uri?: string | null;
  /** Width in px; height follows aspectRatio */
  width?: number;
  /** height = width * aspectRatio (typical book ~1.45) */
  aspectRatio?: number;
  borderRadius?: number;
  accessibilityLabel?: string;
};

export function BookCover({
  uri,
  width = 72,
  aspectRatio = 1.45,
  borderRadius = theme.radius.sm,
  accessibilityLabel = "Portada del libro",
}: BookCoverProps) {
  const height = Math.round(width * aspectRatio);
  const resolved = uri?.trim() ?? "";

  if (!resolved) {
    return (
      <View
        style={[styles.placeholder, { width, height, borderRadius }]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
      >
        <MaterialCommunityIcons name="book-outline" size={Math.min(width, height) * 0.4} color={theme.colors.textSoft} />
      </View>
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
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgSoft,
  },
  placeholder: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
