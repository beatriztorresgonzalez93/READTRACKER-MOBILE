// Formulario para editar la informacion de un libro existente.
import { Heading, Text, VStack } from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, ScrollView } from "react-native";
import { z } from "zod";

import { useAuth } from "@/features/auth/use-auth";
import { BookCoverPicker } from "@/features/books/book-cover-picker";
import { useBookCoverField } from "@/features/books/use-book-cover-field";
import {
  useBookDetail,
  useUpdateBook,
} from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookFormFooter } from "@/shared/ui/book-form-footer";
import { BookFormInput, BookFormLayout, BookFormMultilineInput } from "@/shared/ui/book-form-layout";
import { Screen } from "@/shared/ui/screen";

const editBookSchema = z.object({
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

export default function EditBookScreen() {
  const { token } = useAuth();
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
  const hydratedBookIdRef = useRef<string | null>(null);
  const formScrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<{ title?: string; author?: string; pages?: string; publishedYear?: string }>({});

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

  const formBody = (
    <VStack space="md">
      {Platform.OS === "web" ? (
        <VStack space="xs">
          <Heading size="xl" color="$primary800">
            Editar libro
          </Heading>
          <Text size="sm" color="$textLight700">
            Actualiza los datos basicos de tu libro.
          </Text>
        </VStack>
      ) : null}

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
    </VStack>
  );

  return (
    <Screen
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      edges={["bottom", "left", "right"]}
      compactTop
      style={{ flex: 1 }}
    >
      <BookFormLayout
        scrollRef={formScrollRef}
        footer={
          <BookFormFooter>
            <AppButton
              label={updateBook.isPending ? "Guardando..." : "Guardar cambios"}
              onPress={onSave}
              isDisabled={updateBook.isPending}
              isLoading={updateBook.isPending}
            />
          </BookFormFooter>
        }
      >
        {formBody}
      </BookFormLayout>
    </Screen>
  );
}
