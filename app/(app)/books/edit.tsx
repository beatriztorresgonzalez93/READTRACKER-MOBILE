import { router, useLocalSearchParams } from "expo-router";
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

import {
  useBookDetail,
  useUpdateBook,
} from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

const editBookSchema = z.object({
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

export default function EditBookScreen() {
  const appTheme = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = params.id ?? "";
  const detail = useBookDetail(bookId);
  const updateBook = useUpdateBook(bookId);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [genre, setGenre] = useState("");
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");
  const [coverOptions, setCoverOptions] = useState<string[]>([]);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState("");
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const hydratedBookIdRef = useRef<string | null>(null);
  const formScrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<{ title?: string; author?: string; pages?: string; publishedYear?: string }>({});
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

  useEffect(() => {
    const b = detail.data;
    if (!b) return;
    if (hydratedBookIdRef.current === b.id) return;
    hydratedBookIdRef.current = b.id;

    setTitle(b.title ?? "");
    setAuthor(b.author ?? "");
    setPages(b.pages ? String(b.pages) : "");
    setPublishedYear(b.publishedYear ? String(b.publishedYear) : "");
    setGenre(b.genre ?? "");
    setPublisher(b.publisher ?? "");
    setDescription(b.description ?? "");
    setSelectedCoverUrl(b.coverUrl ?? "");
    setCoverOptions(b.coverUrl ? [b.coverUrl] : []);
  }, [detail.data]);

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

  async function onSave() {
    const parsed = editBookSchema.safeParse({
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
      await updateBook.mutateAsync({
        title: parsed.data.title.trim(),
        author: parsed.data.author.trim(),
        pages: pagesNumber,
        publishedYear: publishedYearNumber,
        genre: parsed.data.genre?.trim() || undefined,
        publisher: parsed.data.publisher?.trim() || undefined,
        description: parsed.data.description?.trim() || undefined,
        coverUrl: selectedCoverUrl.trim() || undefined,
        status: detail.data?.status ?? "pendiente",
      });

      Alert.alert(
        "Libro actualizado",
        "Los cambios se han guardado correctamente.",
      );
      router.back();
    } catch (error) {
      const message = (error as Error).message;
      const shortMessage =
        message.split(" | ")[0]?.trim() || "No se pudo guardar el libro.";
      Alert.alert("No se pudo guardar", shortMessage);
    }
  }

  if (detail.isLoading && !detail.data) return <AppLoader />;

  return (
    <Screen>
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
          <Text style={[styles.title, { color: appTheme.colors.textOnDark }]}>Editar libro</Text>
          <Text style={styles.subtitle}>
            Actualiza los datos basicos de tu libro.
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
          label={updateBook.isPending ? "Guardando..." : "Guardar cambios"}
          onPress={onSave}
          disabled={updateBook.isPending}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: "Inter_600SemiBold",
  },
  coverHelp: {
    color: theme.colors.textMutedOnDark,
    fontSize: 13,
    marginTop: -2,
  },
  coverPickerBlock: {
    gap: 8,
  },
  coverPickerLabel: {
    color: theme.colors.textOnDark,
    fontFamily: "Inter_600SemiBold",
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
