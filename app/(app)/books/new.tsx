// Formulario para crear un nuevo libro con validaciones.
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { useCreateBook } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
import { useNewBookDraftStore } from "@store/new-book-draft";

const newBookSchema = z.object({
  title: z.string().trim().min(1, "El titulo es obligatorio."),
  author: z.string().trim().min(1, "El autor es obligatorio."),
  pages: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 1), "Introduce paginas validas."),
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
  const [isSearchingCover, setIsSearchingCover] = useState(false);
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

  async function onSearchCover() {
    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: "Escribe el titulo para buscar portada." }));
      return;
    }
    try {
      setIsSearchingCover(true);
      const query = [title.trim(), author.trim()].filter(Boolean).join(" ");
      const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Google Books ${response.status}`);
      const payload = (await response.json()) as {
        items?: Array<{
          volumeInfo?: {
            imageLinks?: { thumbnail?: string; smallThumbnail?: string };
          };
        }>;
      };
      const options = (payload.items ?? [])
        .map(
          (item) =>
            item.volumeInfo?.imageLinks?.thumbnail ??
            item.volumeInfo?.imageLinks?.smallThumbnail,
        )
        .filter((img): img is string => Boolean(img))
        .map((img) => img.replace("http://", "https://"))
        .filter((img, idx, arr) => arr.indexOf(img) === idx)
        .slice(0, 8);
      if (options.length === 0) {
        Alert.alert("Sin portada", "No encontramos portada para ese libro.");
        setCoverOptions([]);
        setSelectedCoverUrl("");
        return;
      }
      setCoverOptions(options);
      setSelectedCoverUrl(options[0]);
    } catch (error) {
      Alert.alert("No se pudo buscar portada", (error as Error).message);
    } finally {
      setIsSearchingCover(false);
    }
  }

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
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentKeyboardOpen : null,
          ]}
        >
          <Text style={[styles.title, { color: appTheme.colors.textOnDark }]}>Anadir libro</Text>
          <Text style={styles.subtitle}>
            Completa los datos basicos para incorporarlo a tu biblioteca.
          </Text>

          <AppInput
            label="Titulo *"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
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
          keyboardType="number-pad"
          placeholder="Ej: 2025"
          error={errors.publishedYear}
        />
        <AppInput
          label="Genero"
          value={genre}
          onChangeText={setGenre}
          placeholder="Ej: Fantasia"
        />
        <AppInput
          label="Editorial"
          value={publisher}
          onChangeText={setPublisher}
          placeholder="Ej: Planeta"
        />
        <Text style={styles.coverHelp}>
          La portada se busca automaticamente por titulo y autor.
        </Text>
        <Pressable
          onPress={onSearchCover}
          style={({ pressed }) => [
            styles.coverSearchBtn,
            pressed && styles.coverSearchBtnPressed,
          ]}
        >
          <Text style={[styles.coverSearchLabel, { color: appTheme.colors.textOnDark }]}>
            {isSearchingCover ? "Buscando portada..." : "Buscar portada"}
          </Text>
        </Pressable>
        {coverOptions.length > 0 ? (
          <View style={styles.coverPickerBlock}>
            <Text style={[styles.coverPickerLabel, { color: appTheme.colors.textOnDark }]}>Elige una portada</Text>
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
                    style={[
                      styles.coverOptionBtn,
                      active && styles.coverOptionBtnActive,
                    ]}
                    onPress={() => setSelectedCoverUrl(uri)}
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
        <AppInput
          label="Sinopsis"
          value={description}
          onChangeText={setDescription}
          onFocus={scrollFormToBottom}
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
    paddingTop: 10,
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
  coverSearchBtn: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  coverSearchBtnPressed: {
    opacity: 0.85,
  },
  coverSearchLabel: {
    color: theme.colors.textOnDark,
    fontFamily: "Fraunces_700Bold",
  },
  coverHelp: {
    color: theme.colors.textMutedOnDark,
    fontSize: 13,
    marginTop: -2,
    fontFamily: "Fraunces_400Regular",
  },
  coverPreview: {
    alignItems: "center",
    marginTop: 2,
  },
  coverPickerBlock: {
    gap: 8,
  },
  coverPickerLabel: {
    color: theme.colors.textOnDark,
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
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});
