import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCreateBook } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function NewBookScreen() {
  const appTheme = useAppTheme();
  const createBook = useCreateBook();
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

  async function onSearchCover() {
    if (!title.trim()) {
      Alert.alert("Titulo requerido", "Escribe el titulo para buscar portada.");
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
    if (!title.trim() || !author.trim()) {
      Alert.alert("Campos requeridos", "Titulo y autor son obligatorios.");
      return;
    }
    const pagesNumber = pages.trim() ? Number(pages) : undefined;
    const publishedYearNumber = publishedYear.trim()
      ? Number(publishedYear)
      : undefined;
    if (pages.trim() && (!Number.isFinite(pagesNumber) || pagesNumber! < 1)) {
      Alert.alert(
        "Paginas invalidas",
        "Introduce un numero de paginas valido.",
      );
      return;
    }
    if (
      publishedYear.trim() &&
      (!Number.isFinite(publishedYearNumber) || publishedYearNumber! < 1000)
    ) {
      Alert.alert("Año invalido", "Introduce un año de publicacion valido.");
      return;
    }

    try {
      await createBook.mutateAsync({
        title: title.trim(),
        author: author.trim(),
        pages: pagesNumber,
        publishedYear: publishedYearNumber,
        genre: genre.trim() || undefined,
        publisher: publisher.trim() || undefined,
        description: description.trim() || undefined,
        coverUrl: selectedCoverUrl.trim() || undefined,
      });
      Alert.alert("Libro creado", "El libro se ha anadido correctamente.");
      router.back();
    } catch (error) {
      Alert.alert("No se pudo crear", (error as Error).message);
    }
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: appTheme.colors.textOnDark }]}>Anadir libro</Text>
        <Text style={styles.subtitle}>
          Completa los datos basicos para incorporarlo a tu biblioteca.
        </Text>

        <AppInput
          label="Titulo *"
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Alas de hierro"
        />
        <AppInput
          label="Autor *"
          value={author}
          onChangeText={setAuthor}
          placeholder="Ej: Rebecca Yarros"
        />
        <AppInput
          label="Paginas"
          value={pages}
          onChangeText={setPages}
          keyboardType="number-pad"
          placeholder="Ej: 520"
        />
        <AppInput
          label="Año de publicacion"
          value={publishedYear}
          onChangeText={setPublishedYear}
          keyboardType="number-pad"
          placeholder="Ej: 2025"
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
  coverPreview: {
    alignItems: "center",
    marginTop: 2,
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
