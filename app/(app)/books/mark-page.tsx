// Marcar página de lectura (gluestack-ui).
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";

import {
  BookProgressBar,
  BookSheetHeader,
  BookSheetLabel,
  BookSheetScreen,
} from "@/features/books/book-sheet-ui";
import {
  buildReadingSessionPayload,
  calculateCompletion,
  parseNextPageInput,
} from "@/features/books/lib/mark-page";
import {
  useBookDetail,
  useCreateReadingSession,
} from "@/features/books/use-books";
import { useReadingSessionsList } from "@/features/readingSessions/use-history";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";

export default function BookMarkPageScreen() {
  const { id: bookId } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useBookDetail(bookId);
  const createSession = useCreateReadingSession(bookId);
  const sessionsQuery = useReadingSessionsList();
  const book = detailQuery.data;

  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageHistory, setPageHistory] = useState<{ page: number; when: string }[]>([]);

  const totalPages = Math.max(1, book?.pages ?? 1);
  const completion = calculateCompletion(currentPage, totalPages);

  const bookSessions = useMemo(
    () =>
      (sessionsQuery.data ?? [])
        .filter((session) => session.bookId === bookId)
        .sort(
          (a, b) =>
            Date.parse(b.recordedAt || b.createdAt) -
            Date.parse(a.recordedAt || a.createdAt),
        ),
    [sessionsQuery.data, bookId],
  );
  const latestBookSession = bookSessions[0];

  useEffect(() => {
    const pages = Math.max(1, book?.pages ?? 1);
    const fromProgress = Math.round(((book?.progress ?? 0) / 100) * pages);
    const fromLatestSession = latestBookSession?.currentPage ?? null;
    const initialCandidate =
      fromLatestSession != null && Number.isFinite(fromLatestSession)
        ? fromLatestSession
        : fromProgress;
    const initialPage = Math.max(0, Math.min(pages, Math.round(initialCandidate)));
    setCurrentPage(initialPage);
    setPageInput(initialPage > 0 ? String(initialPage) : "");

    if (bookSessions.length > 0) {
      setPageHistory(
        bookSessions.slice(0, 20).map((session) => ({
          page: Math.max(1, session.currentPage),
          when: session.recordedAt || session.createdAt,
        })),
      );
      return;
    }

    const lastMarkedAt = book?.lastPageMarkedAt;
    if (lastMarkedAt) {
      setPageHistory([{ page: initialPage || 1, when: lastMarkedAt }]);
    } else {
      setPageHistory([]);
    }
  }, [book?.pages, book?.progress, book?.lastPageMarkedAt, latestBookSession?.currentPage, bookSessions]);

  if (detailQuery.isLoading && !book) {
    return (
      <BookSheetScreen>
        <AppLoader />
      </BookSheetScreen>
    );
  }

  async function onSave() {
    const next = parseNextPageInput(pageInput, totalPages);
    if (next == null) {
      Alert.alert("Pagina invalida", `Introduce un valor entre 1 y ${totalPages}.`);
      return;
    }
    try {
      await createSession.mutateAsync(buildReadingSessionPayload(next, currentPage));
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          <BookSheetHeader
            title="Marcar página"
            subtitle={`${book?.title ?? "Libro"} · ${totalPages} páginas`}
          />

          <HStack alignItems="flex-end" space="md">
            <Box flex={1}>
              <AppInput
                label="Pagina actual"
                value={pageInput}
                onChangeText={setPageInput}
                keyboardType="number-pad"
                placeholder="0"
                style={styles.pageInput}
              />
            </Box>
            <Text size="xl" fontWeight="$bold" color="$textLight500">
              / {totalPages}
            </Text>
          </HStack>

          <BookProgressBar percent={completion} />
          <Text size="sm" color="$textLight500">
            Pag. {currentPage} · {completion}% completado
          </Text>

          <BookSheetLabel>Historial reciente</BookSheetLabel>
          {pageHistory.length === 0 ? (
            <Text size="sm" color="$textLight500" fontStyle="italic">
              Aún no hay marcas de página.
            </Text>
          ) : (
            pageHistory.slice(0, 3).map((entry, idx) => (
              <HStack
                key={`${entry.when}-${idx}`}
                justifyContent="space-between"
                py="$2"
                borderBottomWidth={1}
                borderBottomColor="$primary100"
              >
                <Text size="sm" color="$textLight500">
                  {new Date(entry.when).toLocaleString("es-ES")}
                </Text>
                <Text size="sm" fontWeight="$bold" color="$primary800">
                  pag. {entry.page}
                </Text>
              </HStack>
            ))
          )}

          <AppButton
            label={createSession.isPending ? "Guardando..." : "Guardar"}
            onPress={onSave}
            isDisabled={createSession.isPending}
            isLoading={createSession.isPending}
          />
          <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
        </VStack>
      </ScrollView>
    </BookSheetScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  pageInput: {
    fontSize: 24,
    fontWeight: "700",
  },
});
