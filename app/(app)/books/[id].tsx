// Detalle de libro con progreso, reseña, etiquetas y acciones (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

import {
  DetailCard,
  DetailChip,
  DetailLabel,
  DetailTabBar,
  StarRow,
} from "@/features/books/book-detail-ui";
import {
  useBookDetail,
  useBooksFeed,
  useUpdateBook,
} from "@/features/books/use-books";
import { defaultLibraryBooksQuery } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { APP_CREAM_BG, scriptoriumColors } from "@/shared/ui/app-colors";

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

  const similarByGenreFeed = useBooksFeed(
    useMemo(
      () => ({
        ...defaultLibraryBooksQuery,
        genre: book?.genre?.trim() ? book.genre : null,
        sort: "recientes" as const,
      }),
      [book?.genre],
    ),
  );

  const similarByTagsFeed = useBooksFeed(
    useMemo(
      () => ({
        ...defaultLibraryBooksQuery,
        genre: null,
        sort: "recientes" as const,
      }),
      [],
    ),
  );

  const similarBooks = useMemo(() => {
    const targetGenre = book?.genre?.toLowerCase().trim();
    const baseTags = new Set(
      (book?.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    );

    const genreCandidates = (similarByGenreFeed.data?.pages.flatMap((p) => p.items) ?? [])
      .filter((candidate) => candidate.id !== bookId)
      .filter((candidate) =>
        targetGenre && candidate.genre
          ? candidate.genre.toLowerCase().trim() === targetGenre
          : false,
      )
      .map((candidate) => ({ book: candidate, reason: "Mismo género" as const }));

    const alreadyIncluded = new Set(genreCandidates.map((entry) => entry.book.id));

    const tagCandidates = (similarByTagsFeed.data?.pages.flatMap((p) => p.items) ?? [])
      .filter((candidate) => candidate.id !== bookId && !alreadyIncluded.has(candidate.id))
      .filter((candidate) =>
        (candidate.tags ?? []).some((tag) => baseTags.has(tag.toLowerCase().trim())),
      )
      .map((candidate) => ({ book: candidate, reason: "Misma etiqueta" as const }));

    return [...genreCandidates, ...tagCandidates].slice(0, 6);
  }, [book?.genre, book?.tags, bookId, similarByGenreFeed.data?.pages, similarByTagsFeed.data?.pages]);

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
      <Box px="$4" pt="$3" pb="$2" bg="$backgroundLight50" borderBottomWidth={1} borderBottomColor="$primary200">
        <HStack space="md" alignItems="flex-start">
          <BookCover
            uri={book?.coverUrl}
            width={82}
            aspectRatio={1.45}
            borderRadius={4}
            accessibilityLabel={`Portada: ${book?.title}`}
          />
          <VStack flex={1} space="xs" minWidth={0}>
            <Text size="2xl" fontWeight="$bold" color="$primary800" lineHeight={30}>
              {book?.title}
            </Text>
            <Text size="sm" fontStyle="italic" fontWeight="$bold" color="$primary500">
              {book?.author ?? "Autor desconocido"}
            </Text>
            <HStack alignItems="center" space="sm" mt="$1">
              <StarRow rating={book?.rating} />
              {isFavorite ? (
                <HStack alignItems="center" space="xs">
                  <Ionicons name="heart" size={12} color="#D14E72" />
                  <Text size="xs" fontWeight="$bold" color="#D14E72">
                    Favorito
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          </VStack>
        </HStack>
        <DetailTabBar tabs={DETAIL_TABS} activeTab={activeTab} onSelect={(tab) => moveToTab(tab as DetailTab)} />
      </Box>

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
          <DetailCard>
            <Text
              size="xs"
              fontWeight="$bold"
              color="$textLight500"
              textTransform="uppercase"
              letterSpacing={1.2}
              mb="$1"
            >
              Similares
            </Text>
            <Text size="sm" color="$textLight500" mb="$3">
              Libros que podrían interesarte por género o etiquetas en común.
            </Text>
            <View style={styles.similarGrid}>
              {similarBooks.map(({ book: item, reason }) => (
                <Link key={item.id} href={`/(app)/books/${item.id}` as never} asChild>
                  <Pressable style={styles.similarCard}>
                    <BookCover
                      uri={item.coverUrl}
                      width={102}
                      aspectRatio={1.45}
                      borderRadius={6}
                      accessibilityLabel={`Portada: ${item.title}`}
                    />
                    <Text size="sm" fontWeight="$bold" color="$primary800" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text size="xs" color="$textLight500" fontStyle="italic" numberOfLines={1}>
                      {reason}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
            {similarBooks.length === 0 ? (
              <Text size="sm" color="$textLight500" fontStyle="italic">
                Aún no hay suficientes coincidencias por género o etiquetas.
              </Text>
            ) : null}
          </DetailCard>
        </ScrollView>
      </ScrollView>

      <View style={Platform.OS === "web" ? styles.bottomMenu : styles.bottomMenuNative}>
        <Pressable
          style={[
            Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
            styles.menuBtnPrimary,
          ]}
          onPress={() => {
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
          accessibilityLabel={
            activeTab === "Mi reseña" ? "Escribir reseña" : "Editar información del libro"
          }
        >
          <Ionicons
            name={activeTab === "Mi reseña" ? "create" : "create-outline"}
            size={Platform.OS === "web" ? 17 : 22}
            color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.primary}
          />
          {Platform.OS !== "web" ? (
            <Text size="2xs" fontWeight="$bold" color="$textLight500">
              {activeTab === "Mi reseña" ? "Reseña" : "Editar"}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          style={[
            Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
            !canMarkPage && styles.menuBtnDisabled,
          ]}
          disabled={!canMarkPage}
          onPress={() =>
            router.push({
              pathname: "/(app)/books/mark-page",
              params: { id: bookId },
            } as never)
          }
          accessibilityLabel="Marcar página"
        >
          <Ionicons
            name="bookmark-outline"
            size={Platform.OS === "web" ? 17 : 22}
            color={
              canMarkPage
                ? Platform.OS === "web"
                  ? scriptoriumColors.webAccent
                  : scriptoriumColors.primary
                : scriptoriumColors.textMuted
            }
          />
          {Platform.OS !== "web" ? (
            <Text size="2xs" fontWeight="$bold" color="$textLight500">
              Página
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          style={Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative}
          onPress={async () => {
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
          accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={Platform.OS === "web" ? 17 : 22}
            color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.primary}
          />
          {Platform.OS !== "web" ? (
            <Text size="2xs" fontWeight="$bold" color="$textLight500">
              Favorito
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          style={Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative}
          onPress={onDeletePress}
          accessibilityLabel="Eliminar libro"
        >
          <Ionicons
            name="trash-outline"
            size={Platform.OS === "web" ? 17 : 22}
            color={Platform.OS === "web" ? scriptoriumColors.webAccent : scriptoriumColors.danger}
          />
          {Platform.OS !== "web" ? (
            <Text size="2xs" fontWeight="$bold" color="$error600">
              Eliminar
            </Text>
          ) : null}
        </Pressable>
      </View>
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
  similarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  similarCard: {
    width: 108,
    gap: 4,
  },
  bottomMenu: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D8C9AE",
    backgroundColor: "#FFFCF5",
  },
  menuBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D8C9AE",
    backgroundColor: "#FFFCF5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtnPrimary: {},
  menuBtnDisabled: {
    opacity: 0.5,
  },
  bottomMenuNative: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D8C9AE",
    backgroundColor: "#F6F1E7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  menuCellNative: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "#FFFCF5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D8C9AE",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
});
