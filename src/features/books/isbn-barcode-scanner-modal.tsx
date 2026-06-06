// Escaneo de ISBN (nativo) o entrada manual (web).
import { Box, Text, VStack } from "@gluestack-ui/themed";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { resolveBookFromIsbn } from "@/features/books/resolve-book-from-isbn";
import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";
import { parseIsbnFromBarcode } from "@/shared/lib/isbn-utils";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { scrollFieldIntoView } from "@/shared/ui/scroll-field-into-view";
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
  const scrollRef = useRef<ScrollView>(null);
  const scrollViewportRef = useRef<View>(null);
  const isbnFieldRef = useRef<View>(null);
  const scrollOffsetYRef = useRef(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);

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
        const isbnHint = parseIsbnFromBarcode(rawIsbn);
        const base = err instanceof Error ? err.message : "No se pudo buscar el libro.";
        setError(isbnHint && !base.includes(isbnHint) ? `${base} (ISBN leído: ${isbnHint})` : base);
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

  function scrollIsbnFieldIntoView() {
    scrollFieldIntoView(
      scrollRef,
      scrollViewportRef,
      isbnFieldRef,
      scrollViewportHeight,
      scrollOffsetYRef.current,
      {
        bottomInset: 120,
        delayMs: Platform.OS === "android" ? 260 : 180,
      },
    );
  }

  const showCamera = Platform.OS !== "web";

  const isbnInput = (
    <View ref={isbnFieldRef} collapsable={false}>
      <AppInput
        label="ISBN"
        value={manualIsbn}
        onChangeText={setManualIsbn}
        keyboardType="number-pad"
        placeholder="9780156012595"
        autoCapitalize="none"
        onFocus={scrollIsbnFieldIntoView}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View
          ref={scrollViewportRef}
          style={styles.scrollViewport}
          collapsable={false}
          onLayout={(event) => {
            setScrollViewportHeight(event.nativeEvent.layout.height);
          }}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <VStack space="md" style={styles.header}>
              <Text size="lg" fontWeight="$bold" color="$primary800">
                {showCamera ? "Escanear ISBN" : "Buscar por ISBN"}
              </Text>
              <Text size="sm" color="$textLight700">
                {showCamera
                  ? "Apunta al código de barras o escribe el ISBN debajo."
                  : "Introduce el ISBN de 10 o 13 dígitos (suele empezar por 978 o 979)."}
              </Text>
            </VStack>

            {showCamera ? (
              <VStack space="md" px="$4">
                {isbnInput}
                {manualIsbn.trim() ? (
                  <AppButton
                    appearance="secondary"
                    label={isLookingUp ? lookupStatusLabel : "Buscar por ISBN"}
                    onPress={() => void onManualLookup()}
                    isLoading={isLookingUp}
                    isDisabled={isLookingUp}
                  />
                ) : null}
              </VStack>
            ) : (
              <VStack space="md" px="$4">
                {isbnInput}
                <AppButton
                  label={isLookingUp ? lookupStatusLabel : "Buscar libro"}
                  onPress={() => void onManualLookup()}
                  isLoading={isLookingUp}
                  isDisabled={!manualIsbn.trim()}
                />
              </VStack>
            )}

            {showCamera ? (
              <Box style={styles.cameraBox} borderRadius="$lg" overflow="hidden" mx="$4" mt="$3">
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
            ) : null}

            {error ? (
              <Text px="$4" mt="$3" size="sm" color="$error600">
                {error}
              </Text>
            ) : null}

            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text textAlign="center" color="$primary700" fontWeight="$semibold">
                Cancelar
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: 56,
  },
  scrollViewport: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cameraBox: {
    height: 280,
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
