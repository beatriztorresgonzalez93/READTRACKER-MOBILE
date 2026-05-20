// Escaneo de ISBN (nativo) o entrada manual (web).
import { Box, Text, VStack } from "@gluestack-ui/themed";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { resolveBookFromIsbn } from "@/features/books/resolve-book-from-isbn";
import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";
import { parseIsbnFromBarcode } from "@/shared/lib/isbn-utils";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { theme } from "@/shared/ui/theme";

type IsbnBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onBookFound: (metadata: BookMetadataFromIsbn) => void;
  authToken?: string | null;
};

export function IsbnBarcodeScannerModal({
  visible,
  onClose,
  onBookFound,
  authToken,
}: IsbnBarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualIsbn, setManualIsbn] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStage, setLookupStage] = useState<"lookup" | "prepare" | "ai">("lookup");
  const [error, setError] = useState<string | undefined>();
  const [scanned, setScanned] = useState(false);
  const lookupLock = useRef(false);

  useEffect(() => {
    if (!visible) {
      setManualIsbn("");
      setError(undefined);
      setScanned(false);
      setIsLookingUp(false);
      setLookupStage("lookup");
      lookupLock.current = false;
    }
  }, [visible]);

  const lookupStatusLabel =
    lookupStage === "lookup"
      ? "Buscando libro…"
      : lookupStage === "prepare"
        ? "Traduciendo al español…"
        : "Preparando sinopsis en español…";

  const runLookup = useCallback(
    async (rawIsbn: string) => {
      if (lookupLock.current) return;
      lookupLock.current = true;
      setIsLookingUp(true);
      setError(undefined);
      try {
        const metadata = await resolveBookFromIsbn(rawIsbn, {
          token: authToken,
          onStage: setLookupStage,
        });
        onBookFound(metadata);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo buscar el libro.");
        setScanned(false);
        lookupLock.current = false;
      } finally {
        setIsLookingUp(false);
      }
    },
    [authToken, onBookFound, onClose],
  );

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || isLookingUp || lookupLock.current) return;
      const isbn = parseIsbnFromBarcode(data);
      if (!isbn) {
        setError("Código no reconocido como ISBN de libro.");
        return;
      }
      setScanned(true);
      void runLookup(isbn);
    },
    [isLookingUp, runLookup, scanned],
  );

  async function onManualLookup() {
    await runLookup(manualIsbn.trim());
  }

  const showCamera = Platform.OS !== "web";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <VStack space="md" style={styles.header}>
          <Text size="lg" fontWeight="$bold" color="$primary800">
            {showCamera ? "Escanear ISBN" : "Buscar por ISBN"}
          </Text>
          <Text size="sm" color="$textLight700">
            {showCamera
              ? "Apunta al código de barras del lomo o la contraportada (EAN-13)."
              : "Introduce el ISBN de 10 o 13 dígitos (suele empezar por 978 o 979)."}
          </Text>
        </VStack>

        {showCamera ? (
          <Box flex={1} borderRadius="$lg" overflow="hidden" mx="$4">
            {!permission?.granted ? (
              <VStack flex={1} justifyContent="center" alignItems="center" space="md" px="$4">
                <Text textAlign="center" color="$textLight700">
                  Necesitamos permiso de cámara para leer el código de barras.
                </Text>
                <AppButton label="Permitir cámara" onPress={() => void requestPermission()} />
              </VStack>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
                onBarcodeScanned={scanned || isLookingUp ? undefined : handleBarcode}
              />
            )}
            {isLookingUp ? (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text mt="$3" color="$white">
                  {lookupStatusLabel}
                </Text>
              </View>
            ) : null}
          </Box>
        ) : (
          <VStack space="md" px="$4">
            <AppInput
              label="ISBN"
              value={manualIsbn}
              onChangeText={setManualIsbn}
              keyboardType="number-pad"
              placeholder="9780156012595"
              autoCapitalize="none"
            />
            <AppButton
              label={isLookingUp ? lookupStatusLabel : "Buscar libro"}
              onPress={() => void onManualLookup()}
              isLoading={isLookingUp}
              isDisabled={!manualIsbn.trim()}
            />
          </VStack>
        )}

        {error ? (
          <Text px="$4" size="sm" color="$error600">
            {error}
          </Text>
        ) : null}

        <VStack px="$4" pb="$6" space="sm">
          {showCamera ? (
            <AppInput
              label="O escribe el ISBN"
              value={manualIsbn}
              onChangeText={setManualIsbn}
              keyboardType="number-pad"
              placeholder="9780156012595"
              autoCapitalize="none"
            />
          ) : null}
          {showCamera && manualIsbn.trim() ? (
            <AppButton
              appearance="secondary"
              label="Buscar ISBN escrito"
              onPress={() => void onManualLookup()}
              isDisabled={isLookingUp}
            />
          ) : null}
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text textAlign="center" color="$primary700" fontWeight="$semibold">
              Cancelar
            </Text>
          </Pressable>
        </VStack>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    paddingVertical: 12,
  },
});
