// Bloque UI compartido: ayuda, botones buscar/subir y carrusel de portadas.
import { Box, HStack, Pressable, ScrollView, Text, VStack } from "@gluestack-ui/themed";
import { StyleSheet } from "react-native";

import { AppButton } from "@/shared/ui/app-button";
import { BookCover } from "@/shared/ui/book-cover";
import { scriptoriumColors } from "@/shared/ui/app-colors";

type BookCoverPickerProps = {
  coverOptions: string[];
  selectedCoverUrl: string;
  onSelectCover: (uri: string) => void;
  isSearchingCover: boolean;
  isUploadingCover: boolean;
  onSearchCover: () => void;
  onUploadCover: () => void;
};

export function BookCoverPicker({
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
    <VStack space="sm">
      <Text size="sm" color="$textLight600" lineHeight={20}>
        Busca una portada online o sube una imagen (el servidor genera acceso seguro a almacenamiento S3).
      </Text>
      <HStack space="sm">
        <Box flex={1}>
          <AppButton
            appearance="secondary"
            label={isUploadingCover ? "Subiendo..." : "Subir imagen"}
            onPress={onUploadCover}
            isDisabled={busy}
          />
        </Box>
        <Box flex={1}>
          <AppButton
            appearance="secondary"
            label={isSearchingCover ? "Buscando..." : "Buscar online"}
            onPress={onSearchCover}
            isDisabled={busy}
          />
        </Box>
      </HStack>
      {coverOptions.length > 0 ? (
        <VStack space="sm">
          <Text size="sm" fontWeight="$bold" color="$textLight900">
            Elige una portada
          </Text>
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
        </VStack>
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
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
    borderColor: scriptoriumColors.accent,
    backgroundColor: "rgba(232, 204, 122, 0.12)",
  },
});
