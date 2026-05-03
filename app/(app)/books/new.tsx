// Formulario para crear un nuevo libro con validaciones.
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { useAuth } from "@/features/auth/use-auth";
import { BookCoverPicker } from "@/features/books/book-cover-picker";
import { useBookCoverField } from "@/features/books/use-book-cover-field";
import { useCreateBook } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
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
  const appTheme = useAppTheme();
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
  const formScrollRef = useRef<ScrollView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function scrollFormToBottom() {
    setTimeout(() => {
      formScrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }

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
      Alert.alert("Libro creado", "El libro se ha anadido correctamente.");
      resetDraft();
      router.back();
    } catch (error) {
      Alert.alert("No se pudo crear", (error as Error).message);
    }
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <ScrollView
          ref={formScrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentKeyboardOpen : null,
          ]}
        >
          <Text style={[styles.title, { color: appTheme.colors.textOnDark }]}>Añadir libro</Text>
          <Text style={styles.subtitle}>
            Completa los datos basicos para incorporarlo a tu biblioteca.
          </Text>

          <AppInput
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
        <AppInput
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
        <AppInput
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
        <AppInput
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
        <AppInput
          label="Género"
          value={genre}
          onChangeText={setGenre}
          autoCapitalize="sentences"
          placeholder="Ej: Fantasia"
        />
        <AppInput
          label="Editorial"
          value={publisher}
          onChangeText={setPublisher}
          autoCapitalize="sentences"
          placeholder="Ej: Planeta"
        />
        <BookCoverPicker
          accentLabelColor={appTheme.colors.textOnDark}
          coverOptions={coverOptions}
          selectedCoverUrl={selectedCoverUrl}
          onSelectCover={setSelectedCoverUrl}
          isSearchingCover={coverField.isSearchingCover}
          isUploadingCover={coverField.isUploadingCover}
          onSearchCover={coverField.onSearchCover}
          onUploadCover={coverField.onUploadCover}
        />
        <AppInput
          label="Sinopsis"
          value={description}
          onChangeText={setDescription}
          onFocus={scrollFormToBottom}
          autoCapitalize="sentences"
          placeholder="Resumen breve del libro"
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />

        <AppButton
          label={createBook.isPending ? "Guardando..." : "Guardar libro"}
          onPress={onCreate}
          disabled={createBook.isPending}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 22,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  contentKeyboardOpen: {
    paddingBottom: 180,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    color: theme.colors.textOnDark,
  },
  subtitle: {
    color: theme.colors.textMutedOnDark,
    marginBottom: 4,
    fontFamily: "Fraunces_400Regular",
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});
