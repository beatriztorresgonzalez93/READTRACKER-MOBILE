// Barra inferior de acciones en el detalle de libro.
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@gluestack-ui/themed";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { scriptoriumColors } from "@/shared/ui/app-colors";

type BookDetailBottomBarProps = {
  activeTab: string;
  canMarkPage: boolean;
  isFavorite: boolean;
  onEditOrReview: () => void;
  onMarkPage: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
};

export function BookDetailBottomBar({
  activeTab,
  canMarkPage,
  isFavorite,
  onEditOrReview,
  onMarkPage,
  onToggleFavorite,
  onDelete,
}: BookDetailBottomBarProps) {
  const isReviewTab = activeTab === "Mi reseña";

  return (
    <View style={Platform.OS === "web" ? styles.bottomMenu : styles.bottomMenuNative}>
      <Pressable
        style={[
          Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
          styles.menuBtnPrimary,
        ]}
        onPress={onEditOrReview}
        accessibilityLabel={
          isReviewTab ? "Escribir reseña" : "Editar información del libro"
        }
      >
        <Ionicons
          name={isReviewTab ? "create" : "create-outline"}
          size={Platform.OS === "web" ? 17 : 22}
          color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.primary}
        />
        {Platform.OS !== "web" ? (
          <Text size="2xs" fontWeight="$bold" color="$textLight500">
            {isReviewTab ? "Reseña" : "Editar"}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        style={[
          Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
          !canMarkPage && styles.menuBtnDisabled,
        ]}
        disabled={!canMarkPage}
        onPress={onMarkPage}
        accessibilityLabel="Marcar página"
      >
        <Ionicons
          name="bookmark-outline"
          size={Platform.OS === "web" ? 17 : 22}
          color={
            canMarkPage
              ? Platform.OS === "web"
                ? scriptoriumColors.webAccent
                : scriptoriumColors.primary
              : scriptoriumColors.textMuted
          }
        />
        {Platform.OS !== "web" ? (
          <Text size="2xs" fontWeight="$bold" color="$textLight500">
            Página
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        style={Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative}
        onPress={onToggleFavorite}
        accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={Platform.OS === "web" ? 17 : 22}
          color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.primary}
        />
        {Platform.OS !== "web" ? (
          <Text size="2xs" fontWeight="$bold" color="$textLight500">
            Favorito
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        style={Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative}
        onPress={onDelete}
        accessibilityLabel="Eliminar libro"
      >
        <Ionicons
          name="trash-outline"
          size={Platform.OS === "web" ? 17 : 22}
          color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.danger}
        />
        {Platform.OS !== "web" ? (
          <Text size="2xs" fontWeight="$bold" color="$error600">
            Eliminar
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomMenu: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D8C9AE",
    backgroundColor: "#FFFCF5",
  },
  menuBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D8C9AE",
    backgroundColor: "#FFFCF5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtnPrimary: {},
  menuBtnDisabled: {
    opacity: 0.5,
  },
  bottomMenuNative: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D8C9AE",
    backgroundColor: "#F6F1E7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  menuCellNative: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "#FFFCF5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D8C9AE",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
});
