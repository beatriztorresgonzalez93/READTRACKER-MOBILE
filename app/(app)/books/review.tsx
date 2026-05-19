// Escribir o editar la reseña del libro (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  HStack,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";

import { DetailChip } from "@/features/books/book-detail-ui";
import {
  BookSheetLabel,
  BookSheetScreen,
  BookSheetSection,
} from "@/features/books/book-sheet-ui";
import { useBookDetail, useUpdateBook } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookFormFooter } from "@/shared/ui/book-form-footer";
import { BookFormLayout, BookFormMultilineInput } from "@/shared/ui/book-form-layout";
import { openWheelDatePicker, WheelDatePicker } from "@/shared/ui/wheel-date-picker";

const TIMES_READ_OPTIONS = [
  "No leido aun",
  "1ª vez",
  "2ª vez",
  "3ª vez",
  "4ª vez",
  "5ª vez o mas",
] as const;

function toTimesReadLabel(count?: number | null): (typeof TIMES_READ_OPTIONS)[number] {
  if (!count || count <= 0) return "No leido aun";
  if (count === 1) return "1ª vez";
  if (count === 2) return "2ª vez";
  if (count === 3) return "3ª vez";
  if (count === 4) return "4ª vez";
  return "5ª vez o mas";
}

function toReadAtValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ReviewHeaderTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <VStack alignItems="center" maxWidth={280}>
      <Text size="md" fontWeight="$bold" color="$primary800" textAlign="center">
        {title}
      </Text>
      {subtitle ? (
        <Text size="xs" color="$textLight500" textAlign="center" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

export default function BookReviewScreen() {
  const navigation = useNavigation();
  const { id: bookId } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useBookDetail(bookId);
  const updateBook = useUpdateBook(bookId);
  const book = detailQuery.data;
  const scrollRef = useRef<ScrollView>(null);

  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewReadAt, setReviewReadAt] = useState("");
  const [reviewReadAtDate, setReviewReadAtDate] = useState<Date>(new Date());
  const [reviewDatePickerOpen, setReviewDatePickerOpen] = useState(false);
  const [reviewTimesRead, setReviewTimesRead] =
    useState<(typeof TIMES_READ_OPTIONS)[number]>("No leido aun");
  const [reviewFavoriteQuote, setReviewFavoriteQuote] = useState("");
  const [reviewRecommendation, setReviewRecommendation] = useState<
    "si" | "depende" | "no" | undefined
  >(undefined);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewTagInput, setReviewTagInput] = useState("");

  useEffect(() => {
    setReviewDraft(book?.reviewText ?? "");
    setReviewFavoriteQuote(book?.favoriteQuote ?? "");
    setReviewRecommendation(
      book?.recommendation === "si" ||
        book?.recommendation === "depende" ||
        book?.recommendation === "no"
        ? book.recommendation
        : undefined,
    );
    const ratingValue = book?.rating ? Math.max(0, Math.min(5, Math.round(book.rating))) : 0;
    setReviewRating(ratingValue);
    setReviewTags(book?.tags ?? []);
    const normalizedTimesRead =
      book?.timesRead &&
      TIMES_READ_OPTIONS.includes(book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
        ? (book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
        : toTimesReadLabel(book?.readCount);
    setReviewTimesRead(normalizedTimesRead);
    const readAtSource = book?.readAt ?? book?.lastPageMarkedAt;
    const parsedReadAt = readAtSource ? new Date(readAtSource) : null;
    if (parsedReadAt && !Number.isNaN(parsedReadAt.getTime())) {
      setReviewReadAtDate(parsedReadAt);
      setReviewReadAt(toReadAtValue(parsedReadAt));
    }
  }, [book]);

  const bookSubtitle =
    book?.title && book?.author ? `${book.title} · ${book.author}` : book?.title ?? undefined;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <ReviewHeaderTitle title="Mi reseña" subtitle={bookSubtitle} />,
    });
  }, [navigation, bookSubtitle]);

  if (detailQuery.isLoading && !book) {
    return (
      <BookSheetScreen>
        <AppLoader />
      </BookSheetScreen>
    );
  }

  function addReviewTag(raw: string) {
    const normalized = raw.trim().replace(/^#/, "");
    if (!normalized) return;
    if (normalized.length > 30) {
      Alert.alert("Etiqueta demasiado larga", "Maximo 30 caracteres.");
      return;
    }
    setReviewTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, normalized];
    });
    setReviewTagInput("");
  }

  function onReviewDateChange(selectedDate: Date) {
    const boundedDate = selectedDate > new Date() ? new Date() : selectedDate;
    setReviewReadAtDate(boundedDate);
    setReviewReadAt(toReadAtValue(boundedDate));
  }

  function onPressReadDate() {
    if (Platform.OS === "android") {
      openWheelDatePicker({
        value: reviewReadAtDate,
        maximumDate: new Date(),
        onChange: onReviewDateChange,
      });
      return;
    }
    setReviewDatePickerOpen((open) => !open);
  }

  async function onPublish() {
    try {
      await updateBook.mutateAsync({
        reviewText: reviewDraft.trim() || undefined,
        rating: reviewRating > 0 ? reviewRating : undefined,
        readAt: reviewReadAt.trim() || undefined,
        timesRead: reviewTimesRead,
        favoriteQuote: reviewFavoriteQuote.trim() || undefined,
        wouldRecommend: reviewRecommendation,
        reviewTags,
        status: book?.status,
      });
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar la reseña", (error as Error).message);
    }
  }

  const recommendOptions = [
    ["si", "👍 Sí"],
    ["depende", "🤔 Depende"],
    ["no", "👎 No"],
  ] as const;

  return (
    <BookSheetScreen>
      <BookFormLayout
        scrollRef={scrollRef}
        scrollProps={{ contentContainerStyle: styles.scroll }}
        footer={
          <BookFormFooter>
            <VStack space="sm">
              <AppButton
                label={updateBook.isPending ? "Publicando..." : "Publicar reseña"}
                onPress={onPublish}
                isDisabled={updateBook.isPending}
                isLoading={updateBook.isPending}
              />
              <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
            </VStack>
          </BookFormFooter>
        }
      >
          <BookSheetSection>
            <BookSheetLabel>Valoración global</BookSheetLabel>
            <HStack space="sm">
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setReviewRating(value)}>
                  <Ionicons
                    name={reviewRating >= value ? "star" : "star-outline"}
                    size={28}
                    color={reviewRating >= value ? "#A87D42" : "#B8A793"}
                  />
                </Pressable>
              ))}
            </HStack>
          </BookSheetSection>

          <BookSheetSection>
            <HStack space="md" alignItems="flex-start">
              <VStack flex={1}>
                <BookSheetLabel>Leído en</BookSheetLabel>
                <Pressable onPress={onPressReadDate}>
                  <Box
                    borderWidth={1}
                    borderColor="$primary200"
                    borderRadius="$lg"
                    bg="$backgroundLight50"
                    px="$3"
                    py="$3"
                    minHeight={48}
                    justifyContent="center"
                  >
                    <Text size="sm" color="$primary800">
                      {reviewReadAt
                        ? reviewReadAtDate.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Seleccionar fecha..."}
                    </Text>
                  </Box>
                </Pressable>
              </VStack>
              <VStack flex={1}>
                <BookSheetLabel>Veces leído</BookSheetLabel>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/books/times-read",
                      params: { id: bookId },
                    } as never)
                  }
                >
                  <HStack
                    alignItems="center"
                    justifyContent="space-between"
                    borderWidth={1}
                    borderColor="$primary200"
                    borderRadius="$lg"
                    bg="$backgroundLight50"
                    px="$3"
                    py="$3"
                    minHeight={48}
                  >
                    <Text size="sm" color="$primary800" flex={1}>
                      {reviewTimesRead}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#A87D42" />
                  </HStack>
                </Pressable>
              </VStack>
            </HStack>
          </BookSheetSection>

          {reviewDatePickerOpen && Platform.OS !== "android" ? (
            <BookSheetSection>
              <Box
                borderWidth={1}
                borderColor="$primary200"
                borderRadius="$lg"
                bg="$backgroundLight50"
                px="$2"
                py="$3"
              >
                <WheelDatePicker
                  value={reviewReadAtDate}
                  maximumDate={new Date()}
                  onChange={onReviewDateChange}
                  onDismiss={() => setReviewDatePickerOpen(false)}
                />
              </Box>
            </BookSheetSection>
          ) : null}

          <BookSheetSection>
            <BookFormMultilineInput
              label="Reseña personal"
              value={reviewDraft}
              onChangeText={(text: string) => setReviewDraft(text.slice(0, 2000))}
              numberOfLines={6}
              placeholder="¿Qué te pareció el libro?"
            />
          </BookSheetSection>

          <BookSheetSection>
            <BookFormMultilineInput
              label="Frase favorita"
              value={reviewFavoriteQuote}
              onChangeText={setReviewFavoriteQuote}
              numberOfLines={4}
              placeholder="Una frase del libro..."
            />
          </BookSheetSection>

          <BookSheetSection>
            <BookSheetLabel>Etiquetas</BookSheetLabel>
            <HStack space="sm" alignItems="center">
              <Box flex={1}>
                <AppInput
                  label="Nueva etiqueta"
                  hideLabel
                  noMargin
                  accessibilityLabel="Nueva etiqueta"
                  value={reviewTagInput}
                  onChangeText={setReviewTagInput}
                  onSubmitEditing={() => addReviewTag(reviewTagInput)}
                  placeholder="Nueva etiqueta"
                  returnKeyType="done"
                />
              </Box>
              <Pressable
                onPress={() => addReviewTag(reviewTagInput)}
                style={styles.tagAddBtn}
                accessibilityLabel="Añadir etiqueta"
              >
                <Ionicons name="add" size={20} color="#FFFCF5" />
              </Pressable>
            </HStack>
            {reviewTags.length > 0 ? (
              <HStack flexWrap="wrap" space="sm" mt="$3">
                {reviewTags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setReviewTags((prev) => prev.filter((value) => value !== tag))}
                  >
                    <DetailChip>#{tag} ×</DetailChip>
                  </Pressable>
                ))}
              </HStack>
            ) : null}
          </BookSheetSection>

          <BookSheetSection>
            <BookSheetLabel>¿Lo recomendarías?</BookSheetLabel>
            <HStack space="sm">
              {recommendOptions.map(([key, label]) => {
                const active = reviewRecommendation === key;
                return (
                  <Pressable key={key} flex={1} onPress={() => setReviewRecommendation(key)}>
                    <Box
                      py="$2.5"
                      px="$2"
                      borderRadius="$md"
                      borderWidth={1}
                      borderColor={active ? "$primary500" : "$primary200"}
                      bg={active ? "$primary500" : "$backgroundLight50"}
                      alignItems="center"
                      minHeight={44}
                      justifyContent="center"
                    >
                      <Text
                        size="sm"
                        fontWeight="$bold"
                        textAlign="center"
                        color={active ? "#FFFCF5" : "$primary800"}
                      >
                        {label}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })}
            </HStack>
          </BookSheetSection>
      </BookFormLayout>
    </BookSheetScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tagAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#A87D42",
    alignItems: "center",
    justifyContent: "center",
  },
});
