// Formulario para crear un nuevo libro con validaciones.
import { Heading, Text, VStack } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Platform, ScrollView } from "react-native";

import {
  defaultReminderDate,
  ReadingReminderField,
} from "@/shared/notifications/reading-reminder-field";
import { scheduleReminder } from "@/shared/notifications/schedule-reminder";
import { z } from "zod";

import { useAuth } from "@/features/auth/use-auth";
import { BookCoverPicker } from "@/features/books/book-cover-picker";
import { IsbnBarcodeScannerModal } from "@/features/books/isbn-barcode-scanner-modal";
import { useBookCoverField } from "@/features/books/use-book-cover-field";
import { useCreateBook } from "@/features/books/use-books";
import { useFillBookFromIsbn } from "@/features/books/use-fill-book-from-isbn";
import { AppButton } from "@/shared/ui/app-button";
import { BookFormFooter } from "@/shared/ui/book-form-footer";
import { BookFormInput, BookFormLayout, BookFormMultilineInput } from "@/shared/ui/book-form-layout";
import { Screen } from "@/shared/ui/screen";
import { useNewBookDraftStore } from "@store/new-book-draft";

const newBookSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio."),
  author: z.string().trim().min(1, "El autor es obligatorio."),
  pages: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 1), "Introduce páginas válidas."),
  publishedYear: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 1000), "Introduce un año valido."),
  genre: z.string().optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
});

export default function NewBookScreen() {
  const { token } = useAuth();
  const createBook = useCreateBook();
  const title = useNewBookDraftStore((state) => state.title);
  const setTitle = useNewBookDraftStore((state) => state.setTitle);
  const author = useNewBookDraftStore((state) => state.author);
  const setAuthor = useNewBookDraftStore((state) => state.setAuthor);
  const pages = useNewBookDraftStore((state) => state.pages);
  const setPages = useNewBookDraftStore((state) => state.setPages);
  const publishedYear = useNewBookDraftStore((state) => state.publishedYear);
  const setPublishedYear = useNewBookDraftStore((state) => state.setPublishedYear);
  const genre = useNewBookDraftStore((state) => state.genre);
  const setGenre = useNewBookDraftStore((state) => state.setGenre);
  const publisher = useNewBookDraftStore((state) => state.publisher);
  const setPublisher = useNewBookDraftStore((state) => state.setPublisher);
  const description = useNewBookDraftStore((state) => state.description);
  const setDescription = useNewBookDraftStore((state) => state.setDescription);
  const coverOptions = useNewBookDraftStore((state) => state.coverOptions);
  const setCoverOptions = useNewBookDraftStore((state) => state.setCoverOptions);
  const selectedCoverUrl = useNewBookDraftStore((state) => state.selectedCoverUrl);
  const setSelectedCoverUrl = useNewBookDraftStore((state) => state.setSelectedCoverUrl);
  const resetDraft = useNewBookDraftStore((state) => state.resetDraft);
  const [errors, setErrors] = useState<{ title?: string; author?: string; pages?: string; publishedYear?: string }>({});
  const [isbnScannerVisible, setIsbnScannerVisible] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(defaultReminderDate);
  const formScrollRef = useRef<ScrollView>(null);
  const fillFromIsbn = useFillBookFromIsbn();

  const coverField = useBookCoverField({
    token,
    title,
    author,
    coverOptions,
    setCoverOptions,
    setSelectedCoverUrl,
    onMissingTitleForCover: () =>
      setErrors((prev) => ({ ...prev, title: "Escribe el título para buscar portada." })),
  });

  async function onCreate() {
    const parsed = newBookSchema.safeParse({
      title,
      author,
      pages,
      publishedYear,
      genre,
      publisher,
      description,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        author: fieldErrors.author?.[0],
        pages: fieldErrors.pages?.[0],
        publishedYear: fieldErrors.publishedYear?.[0],
      });
      return;
    }
    setErrors({});
    const pagesNumber = parsed.data.pages.trim() ? Number(parsed.data.pages) : undefined;
    const publishedYearNumber = parsed.data.publishedYear.trim() ? Number(parsed.data.publishedYear) : undefined;

    try {
      await createBook.mutateAsync({
        title: parsed.data.title.trim(),
        author: parsed.data.author.trim(),
        pages: pagesNumber,
        publishedYear: publishedYearNumber,
        genre: parsed.data.genre?.trim() || undefined,
        publisher: parsed.data.publisher?.trim() || undefined,
        description: parsed.data.description?.trim() || undefined,
        coverUrl: selectedCoverUrl.trim() || undefined,
      });

      let reminderMessage = "";
      if (reminderEnabled && Platform.OS !== "web") {
        const bookTitle = parsed.data.title.trim();
        const notificationId = await scheduleReminder(bookTitle, reminderDate);
        if (notificationId) {
          reminderMessage = "\n\nRecordatorio de lectura programado.";
        } else {
          reminderMessage =
            "\n\nNo se pudo programar el recordatorio (permiso denegado o fecha no válida).";
        }
      }

      Alert.alert("Libro creado", `El libro se ha anadido correctamente.${reminderMessage}`);
      resetDraft();
      router.back();
    } catch (error) {
      Alert.alert("No se pudo crear", (error as Error).message);
    }
  }

  const formBody = (
    <VStack space="md">
      {Platform.OS === "web" ? (
        <VStack space="xs">
          <Heading size="xl" color="$primary800">
            Añadir libro
          </Heading>
          <Text size="sm" color="$textLight700">
            Completa los datos basicos para incorporarlo a tu biblioteca.
          </Text>
        </VStack>
      ) : null}

      <AppButton
        appearance="secondary"
        label="Escanear código de barras (ISBN)"
        onPress={() => setIsbnScannerVisible(true)}
      />

      <BookFormInput
              label="Título *"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              autoCapitalize="sentences"
              placeholder="Ej: Alas de hierro"
              error={errors.title}
            />
            <BookFormInput
              label="Autor *"
              value={author}
              onChangeText={(value) => {
                setAuthor(value);
                if (errors.author) setErrors((prev) => ({ ...prev, author: undefined }));
              }}
              autoCapitalize="words"
              placeholder="Ej: Rebecca Yarros"
              error={errors.author}
            />
            <BookFormInput
              label="Paginas"
              value={pages}
              onChangeText={(value) => {
                setPages(value);
                if (errors.pages) setErrors((prev) => ({ ...prev, pages: undefined }));
              }}
              autoCapitalize="none"
              keyboardType="number-pad"
              placeholder="Ej: 520"
              error={errors.pages}
            />
            <BookFormInput
              label="Año de publicacion"
              value={publishedYear}
              onChangeText={(value) => {
                setPublishedYear(value);
                if (errors.publishedYear) setErrors((prev) => ({ ...prev, publishedYear: undefined }));
              }}
              autoCapitalize="none"
              keyboardType="number-pad"
              placeholder="Ej: 2025"
              error={errors.publishedYear}
            />
            <BookFormInput
              label="Género"
              value={genre}
              onChangeText={setGenre}
              autoCapitalize="sentences"
              placeholder="Ej: Fantasia"
            />
            <BookFormInput
              label="Editorial"
              value={publisher}
              onChangeText={setPublisher}
              autoCapitalize="sentences"
              placeholder="Ej: Planeta"
            />
            <BookCoverPicker
              coverOptions={coverOptions}
              selectedCoverUrl={selectedCoverUrl}
              onSelectCover={setSelectedCoverUrl}
              isSearchingCover={coverField.isSearchingCover}
              isUploadingCover={coverField.isUploadingCover}
              onSearchCover={coverField.onSearchCover}
              onUploadCover={coverField.onUploadCover}
            />
            <BookFormMultilineInput
              label="Sinopsis"
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              placeholder="Resumen breve del libro"
              numberOfLines={6}
            />
            <ReadingReminderField
              enabled={reminderEnabled}
              onEnabledChange={setReminderEnabled}
              date={reminderDate}
              onDateChange={setReminderDate}
            />
    </VStack>
  );

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      compactTop
      style={{ flex: 1 }}
    >
      <IsbnBarcodeScannerModal
        visible={isbnScannerVisible}
        onClose={() => setIsbnScannerVisible(false)}
        onBookFound={fillFromIsbn}
        authToken={token}
      />
      <BookFormLayout
        scrollRef={formScrollRef}
        footer={
          <BookFormFooter>
            <AppButton
              label={createBook.isPending ? "Guardando..." : "Guardar libro"}
              onPress={onCreate}
              isDisabled={createBook.isPending}
              isLoading={createBook.isPending}
            />
          </BookFormFooter>
        }
      >
        {formBody}
      </BookFormLayout>
    </Screen>
  );
}
