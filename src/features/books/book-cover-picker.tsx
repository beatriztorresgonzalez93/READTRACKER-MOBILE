// Bloque UI compartido: ayuda, botones buscar/subir y carrusel de portadas.
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BookCover } from "@/shared/ui/book-cover";
import { theme } from "@/shared/ui/theme";

type BookCoverPickerProps = {
  accentLabelColor: string;
  coverOptions: string[];
  selectedCoverUrl: string;
  onSelectCover: (uri: string) => void;
  isSearchingCover: boolean;
  isUploadingCover: boolean;
  onSearchCover: () => void;
  onUploadCover: () => void;
};

export function BookCoverPicker({
  accentLabelColor,
  coverOptions,
  selectedCoverUrl,
  onSelectCover,
  isSearchingCover,
  isUploadingCover,
  onSearchCover,
  onUploadCover,
}: BookCoverPickerProps) {
  const busy = isUploadingCover || isSearchingCover;

  return (
    <>
      <Text style={styles.coverHelp}>
        Busca una portada online o sube una imagen (el servidor genera acceso seguro a almacenamiento S3).
      </Text>
      <View style={styles.coverActionsRow}>
        <Pressable
          onPress={onUploadCover}
          disabled={busy}
          style={({ pressed }) => [
            styles.coverActionBtn,
            pressed && styles.coverBtnPressed,
            busy && styles.coverActionBtnDisabled,
          ]}
        >
          <Text style={[styles.coverBtnLabel, { color: accentLabelColor }]}>
            {isUploadingCover ? "Subiendo..." : "Subir imagen"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onSearchCover}
          disabled={busy}
          style={({ pressed }) => [
            styles.coverActionBtn,
            pressed && styles.coverBtnPressed,
            busy && styles.coverActionBtnDisabled,
          ]}
        >
          <Text style={[styles.coverBtnLabel, { color: accentLabelColor }]}>
            {isSearchingCover ? "Buscando..." : "Buscar online"}
          </Text>
        </Pressable>
      </View>
      {coverOptions.length > 0 ? (
        <View style={styles.coverPickerBlock}>
          <Text style={[styles.coverPickerLabel, { color: accentLabelColor }]}>Elige una portada</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coverOptionsRow}
          >
            {coverOptions.map((uri) => {
              const active = uri === selectedCoverUrl;
              return (
                <Pressable
                  key={uri}
                  style={[styles.coverOptionBtn, active && styles.coverOptionBtnActive]}
                  onPress={() => onSelectCover(uri)}
                >
                  <BookCover
                    uri={uri}
                    width={88}
                    aspectRatio={1.45}
                    borderRadius={6}
                    accessibilityLabel="Opcion de portada"
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  coverActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  coverActionBtn: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  coverActionBtnDisabled: {
    opacity: 0.55,
  },
  coverBtnPressed: {
    opacity: 0.85,
  },
  coverBtnLabel: {
    fontFamily: "Fraunces_700Bold",
  },
  coverHelp: {
    color: theme.colors.textMutedOnDark,
    fontSize: 13,
    marginTop: -2,
    fontFamily: "Fraunces_400Regular",
  },
  coverPickerBlock: {
    gap: 8,
  },
  coverPickerLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
  },
  coverOptionsRow: {
    gap: 10,
    paddingRight: 4,
  },
  coverOptionBtn: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 2,
  },
  coverOptionBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(232, 204, 122, 0.12)",
  },
});
