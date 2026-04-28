import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { useBookDetail, useCreateReadingSession } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function BookDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = params.id;
  const detailQuery = useBookDetail(bookId);
  const createSession = useCreateReadingSession(bookId);
  const [page, setPage] = useState("");

  async function onSaveProgress() {
    const numericPage = Number(page);

    if (!Number.isFinite(numericPage) || numericPage < 1) {
      Alert.alert("Pagina invalida", "La pagina debe ser mayor o igual a 1.");
      return;
    }

    if (detailQuery.data?.pages && numericPage > detailQuery.data.pages) {
      Alert.alert("Pagina invalida", "No puede superar el total de paginas del libro.");
      return;
    }

    try {
      const currentProgress = detailQuery.data?.progress ?? 0;
      const totalPages = detailQuery.data?.pages ?? 0;
      const previousPage =
        totalPages > 0 ? Math.round((Math.max(0, Math.min(100, currentProgress)) / 100) * totalPages) : undefined;
      await createSession.mutateAsync({
        currentPage: numericPage,
        previousPage,
      });
      setPage("");
      Alert.alert("Sesion guardada", "El progreso se actualizo correctamente.");
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message);
    }
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return <AppLoader />;
  }

  const book = detailQuery.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.coverWrap}>
            <BookCover uri={book?.coverUrl} width={160} aspectRatio={1.5} accessibilityLabel={`Portada: ${book?.title}`} />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            {book?.title}
          </Text>
          <Text variant="bodyMedium" style={styles.meta}>
            {book?.author ?? "Autor desconocido"}
          </Text>
          <Text variant="bodySmall" style={styles.metaMuted}>
            Progreso {Math.round(book?.progress ?? 0)}% · {book?.pages ?? "?"} paginas
          </Text>
          {book?.description ? (
            <Text variant="bodyMedium" style={styles.description}>
              {book.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>
          <Text variant="titleMedium" style={styles.formTitle}>
            Registrar sesion
          </Text>
          <AppInput
            label="Pagina alcanzada"
            keyboardType="number-pad"
            value={page}
            onChangeText={setPage}
            placeholder="Ej: 135"
          />
          <AppButton
            label={createSession.isPending ? "Guardando..." : "Guardar progreso"}
            onPress={onSaveProgress}
            disabled={createSession.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 8,
  },
  coverWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    marginTop: 4,
  },
  meta: {
    color: theme.colors.textSoft,
  },
  metaMuted: {
    color: theme.colors.textSoft,
    marginTop: -2,
  },
  description: {
    marginTop: 8,
    color: theme.colors.text,
    lineHeight: 22,
  },
  form: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 12,
  },
  formTitle: {
    color: theme.colors.text,
  },
});

