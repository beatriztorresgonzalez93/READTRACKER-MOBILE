// Detalle de libro con progreso, reseña, etiquetas y acciones (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import { HStack, Pressable, Text } from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { BookDetailBottomBar } from "@/features/books/book-detail-bottom-bar";
import { BookDetailHeader } from "@/features/books/book-detail-header";
import { BookDetailSimilarBooks } from "@/features/books/book-detail-similar-books";
import {
  DetailCard,
  DetailChip,
  DetailLabel,
} from "@/features/books/book-detail-ui";
import { useBookDetail, useUpdateBook } from "@/features/books/use-books";
import { useSimilarBooks } from "@/features/books/use-similar-books";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";

const DETAIL_TABS = ["Información", "Mi reseña", "Similares"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

export default function BookDetailScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Platform.OS === "web" ? Math.min(width, 1120) : width;
  const pagerRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = params.id;
  const detailQuery = useBookDetail(bookId);
  const updateBook = useUpdateBook(bookId);
  const [activeTab, setActiveTab] = useState<DetailTab>("Información");
  const [selectedStatus, setSelectedStatus] =
    useState<"pendiente" | "leyendo" | "leido">("pendiente");
  const [isFavorite, setIsFavorite] = useState(false);
  const book = detailQuery.data;

  const similarBooks = useSimilarBooks(bookId, book?.genre, book?.tags);

  const year = book?.publishedYear ? String(book.publishedYear) : "—";
  const reviewText =
    book?.reviewText ?? "Aún no has escrito una reseña para este libro.";
  const canMarkPage = selectedStatus === "leyendo";
  const recommendationValue = (book?.recommendation ?? "").toLowerCase().trim();
  const recommendationLabel =
    recommendationValue === "si"
      ? "👍 Sí, lo recomiendo"
      : recommendationValue === "depende"
        ? "🤔 Depende del lector"
        : recommendationValue === "no"
          ? "👎 No especialmente"
          : "Aún sin recomendación.";
  const readAtLabel =
    book?.readAt || book?.lastPageMarkedAt
      ? new Date(book?.readAt ?? book?.lastPageMarkedAt ?? "").toLocaleDateString("es-ES")
      : "Sin registro";
  const timesReadLabel = book?.timesRead
    ? book.timesRead
    : book?.readCount
      ? `${book.readCount} vez${book.readCount > 1 ? "es" : ""}`
      : "No leido aun";

  useLayoutEffect(() => {
    if (Platform.OS === "web") return;
    const raw = book?.title?.trim() ?? "";
    const title =
      raw.length === 0 ? "Libro" : raw.length > 32 ? `${raw.slice(0, 32)}…` : raw;
    navigation.setOptions({ title });
  }, [book?.title, navigation]);

  useEffect(() => {
    const fromBook = book?.status;
    if (fromBook === "pendiente" || fromBook === "leyendo" || fromBook === "leido") {
      setSelectedStatus(fromBook);
    }
  }, [book?.status]);

  useEffect(() => {
    setIsFavorite(Boolean(book?.isFavorite));
  }, [book?.isFavorite]);

  if (detailQuery.isLoading && !detailQuery.data) {
    return <AppLoader />;
  }

  function onDeletePress() {
    router.push({
      pathname: "/(app)/books/delete-book",
      params: { id: bookId },
    } as never);
  }

  function moveToTab(tab: DetailTab) {
    setActiveTab(tab);
    const idx = DETAIL_TABS.indexOf(tab);
    pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: true });
  }

  function onPagerEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x;
    const idx = Math.round(x / pageWidth);
    setActiveTab(DETAIL_TABS[idx] ?? "Información");
  }

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{ paddingHorizontal: 0, paddingTop: 0 }}
    >
      <BookDetailHeader
        title={book?.title}
        author={book?.author}
        coverUrl={book?.coverUrl}
        rating={book?.rating}
        isFavorite={isFavorite}
        tabs={DETAIL_TABS}
        activeTab={activeTab}
        onSelectTab={(tab) => moveToTab(tab as DetailTab)}
      />

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerEnd}
        style={styles.pager}
      >
        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <DetailCard>
            <DetailLabel icon="bookmark-outline" label="Estado de lectura" />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/books/status",
                  params: { id: bookId },
                } as never)
              }
            >
              <HStack
                alignItems="center"
                justifyContent="space-between"
                bg="$primary600"
                borderRadius="$md"
                px="$3"
                py="$2.5"
              >
                <Text color="#FFF2D4" fontWeight="$bold" letterSpacing={0.6}>
                  {selectedStatus.toUpperCase()}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#FFF2D4" />
              </HStack>
            </Pressable>
          </DetailCard>

          <DetailCard>
            <Text size="lg" fontWeight="$bold" color="$primary800" mb="$2">
              Detalles del libro
            </Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <DetailLabel icon="calendar-outline" label="Publicado en" />
                <Text size="md" fontWeight="$bold" color="$primary800">
                  {year}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <DetailLabel icon="book-outline" label="Paginas" />
                <Text size="md" fontWeight="$bold" color="$primary800">
                  {book?.pages ?? "—"}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <DetailLabel icon="pricetag-outline" label="Género" />
                <Text size="md" fontWeight="$bold" color="$primary800">
                  {book?.genre ?? "Sin género"}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <DetailLabel icon="business-outline" label="Editorial" />
                <Text size="md" fontWeight="$bold" color="$primary800">
                  {book?.publisher ?? "—"}
                </Text>
              </View>
            </View>
          </DetailCard>

          <DetailCard>
            <DetailLabel icon="document-text-outline" label="Sinopsis" emphasize />
            <Text size="md" color="$primary800" lineHeight={22}>
              {book?.description ?? "No hay sinopsis disponible."}
            </Text>
          </DetailCard>
        </ScrollView>

        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <DetailCard>
            <DetailLabel icon="create-outline" label="Mi reseña" />
            <Text size="md" color="$primary800" lineHeight={22}>
              {reviewText}
            </Text>
          </DetailCard>

          <HStack space="md">
            <DetailCard flex={1}>
              <DetailLabel icon="calendar-outline" label="Leido en" />
              <Text size="md" fontWeight="$bold" color="$primary800">
                {readAtLabel}
              </Text>
            </DetailCard>
            <DetailCard flex={1}>
              <DetailLabel icon="repeat-outline" label="Veces leido" />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/books/times-read",
                    params: { id: bookId },
                  } as never)
                }
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <Text size="md" fontWeight="$bold" color="$primary800">
                    {timesReadLabel}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#A87D42" />
                </HStack>
              </Pressable>
            </DetailCard>
          </HStack>

          <DetailCard>
            <DetailLabel icon="chatbubble-ellipses-outline" label="Frase o cita favorita" />
            <Text size="md" color="$primary800" lineHeight={22}>
              {book?.favoriteQuote ?? "Sin cita favorita por ahora."}
            </Text>
          </DetailCard>

          <DetailCard>
            <DetailLabel icon="thumbs-up-outline" label="Recomendacion" emphasize />
            <HStack flexWrap="wrap" space="sm">
              <DetailChip>{recommendationLabel}</DetailChip>
            </HStack>
          </DetailCard>

          <DetailCard>
            <DetailLabel icon="pricetags-outline" label="Etiquetas tematicas" emphasize />
            {book?.tags && book.tags.length > 0 ? (
              <HStack flexWrap="wrap" space="sm">
                {book.tags.map((tag) => (
                  <DetailChip key={tag}>#{tag}</DetailChip>
                ))}
              </HStack>
            ) : (
              <Text size="sm" color="$textLight500" fontStyle="italic">
                Sin etiquetas todavía.
              </Text>
            )}
          </DetailCard>
        </ScrollView>

        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <BookDetailSimilarBooks similarBooks={similarBooks} />
        </ScrollView>
      </ScrollView>

      <BookDetailBottomBar
        activeTab={activeTab}
        canMarkPage={canMarkPage}
        isFavorite={isFavorite}
        onEditOrReview={() => {
          if (activeTab === "Mi reseña") {
            router.push({
              pathname: "/(app)/books/review",
              params: { id: bookId },
            } as never);
            return;
          }
          router.push({
            pathname: "/(app)/books/edit",
            params: { id: bookId },
          } as never);
        }}
        onMarkPage={() =>
          router.push({
            pathname: "/(app)/books/mark-page",
            params: { id: bookId },
          } as never)
        }
        onToggleFavorite={async () => {
          const previous = isFavorite;
          const next = !previous;
          setIsFavorite(next);
          try {
            await updateBook.mutateAsync({
              isFavorite: next,
              status: selectedStatus,
            });
          } catch (error) {
            setIsFavorite(previous);
            Alert.alert("No se pudo actualizar", (error as Error).message);
          }
        }}
        onDelete={onDeletePress}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    backgroundColor: "#F6F1E7",
  },
  tabContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 96,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 12,
  },
  detailCell: {
    width: "47%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D8C9AE",
    paddingBottom: 8,
  },
});
