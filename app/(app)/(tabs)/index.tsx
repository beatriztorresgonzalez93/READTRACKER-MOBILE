// Pantalla principal de biblioteca con filtros, resumen y coleccion.
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  ProgressBar,
  Searchbar,
  Text,
} from "react-native-paper";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useBooksFeed,
  useBooksSummary,
  useLeyendoPreview,
} from "@/features/books/use-books";
import { useReadingSessionsList } from "@/features/readingSessions/use-history";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type {
  Book,
  BooksSortKey,
  LibraryBooksQuery,
  LibraryShelfFilter,
  LibraryStatusFilter,
} from "@/shared/types/books";
import type { PurchaseItem } from "@/shared/types/wishlist";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
import { useLibraryPreferencesStore } from "@store/library-preferences";

const isWeb = Platform.OS === "web";

const COLLECTION_CARD_WIDTH = 146;
const COLLECTION_CARD_WIDTH_MOBILE = 160;
const COLLECTION_COVER_RATIO = 1.42;
const GRID_COVER_WIDTH = 168;

const SORT_LABELS: Record<BooksSortKey, string> = {
  recientes: "Mas recientes",
  titulo: "Título (A-Z)",
  autor: "Autor (A-Z)",
  genero: "Género (A-Z)",
  valoracion: "Valoración",
};

const SORT_OPTIONS: { key: BooksSortKey; label: string }[] = (
  Object.keys(SORT_LABELS) as BooksSortKey[]
).map((key) => ({ key, label: SORT_LABELS[key] }));

const STATUS_OPTIONS: { key: LibraryStatusFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "leyendo", label: "Leyendo" },
  { key: "leido", label: "Leidos" },
];

const SHELF_OPTIONS: { key: LibraryShelfFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "favoritos", label: "Favoritos" },
];

function isFilteredQuery(q: LibraryBooksQuery): boolean {
  return (
    q.search.trim() !== "" ||
    q.status !== "todos" ||
    q.shelf !== "todos" ||
    q.genre !== null ||
    q.sort !== "recientes"
  );
}

function StarRow({ rating }: { rating?: number | null }) {
  const raw = rating != null && Number.isFinite(rating) ? rating : 0;
  const normalized = raw > 5 ? raw / 2 : raw;
  const full = Math.min(5, Math.max(0, Math.round(normalized)));
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? "star" : "star-outline"}
          size={14}
          color={theme.colors.primary}
        />
      ))}
    </View>
  );
}

function StatsStrip({
  total,
  leido,
  ratingLabel,
  yearLabel,
}: {
  total: number;
  leido: number;
  ratingLabel: string;
  yearLabel: string;
}) {
  const cells = [
    { icon: "book-outline" as const, value: String(total), label: "LIBROS" },
    {
      icon: "bookmark-outline" as const,
      value: String(leido),
      label: "LEIDOS",
    },
    { icon: "star-outline" as const, value: ratingLabel, label: "VALORACION" },
    { icon: "trophy-outline" as const, value: yearLabel, label: "MEJOR AÑO" },
  ];

  if (!isWeb) {
    return (
      <View style={styles.statsRowMobile}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.statsCellMobile}>
            <Ionicons
              name={cell.icon}
              size={16}
              color={theme.colors.primary}
              style={styles.statsIcon}
            />
            <NativeText style={styles.statsValueMobile}>
              {cell.value}
            </NativeText>
            <NativeText style={styles.statsLabelMobile}>
              {cell.label}
            </NativeText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <Card mode="contained" style={styles.statsCard}>
      <Card.Content style={{ paddingVertical: 0, paddingHorizontal: 0 }}>
        <View style={styles.statsRow}>
          {cells.map((cell, idx) => (
            <View
              key={cell.label}
              style={[
                styles.statsCell,
                idx < cells.length - 1 && styles.statsCellBorder,
              ]}
            >
              <Ionicons
                name={cell.icon}
                size={14}
                color={theme.colors.primary}
                style={styles.statsIcon}
              />
              <Text style={styles.statsValue}>{cell.value}</Text>
              <Text style={styles.statsLabel}>{cell.label}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

function CollectionBookCard({ book }: { book: Book }) {
  const cardWidth = isWeb ? COLLECTION_CARD_WIDTH : COLLECTION_CARD_WIDTH_MOBILE;
  const h = Math.round(cardWidth * COLLECTION_COVER_RATIO);
  return (
    <Link href={`/(app)/books/${book.id}` as never} asChild>
      <Pressable
        style={isWeb ? styles.collectionCard : styles.collectionCardMobile}
      >
        <View style={[styles.collectionCoverWrap, { height: h }]}>
          <BookCover
            uri={book.coverUrl}
            width={cardWidth}
            aspectRatio={COLLECTION_COVER_RATIO}
            borderRadius={isWeb ? 4 : 10}
          />
          {book.isFavorite ? (
            <View style={styles.collectionHeart}>
              <Ionicons name="heart" size={16} color="#E879A9" />
            </View>
          ) : null}
        </View>
        <View style={styles.collectionMeta}>
          <Text
            variant="titleSmall"
            style={styles.collectionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {book.title}
          </Text>
          <Text style={styles.collectionAuthor} numberOfLines={1}>
            {book.author ?? "Autor desconocido"}
          </Text>
          <StarRow rating={book.rating} />
        </View>
      </Pressable>
    </Link>
  );
}

function ReadingNowCard({ book }: { book: Book }) {
  const progress = Math.max(0, Math.min(100, Math.round(book.progress ?? 0)));
  return (
    <Link href={`/(app)/books/${book.id}` as never} asChild>
      <Pressable
        style={isWeb ? styles.readingCard : styles.readingCardMobile}
      >
        <BookCover
          uri={book.coverUrl}
          width={88}
          aspectRatio={1.45}
          accessibilityLabel={`Portada: ${book.title}`}
        />
        <View style={styles.readingBody}>
          <Text
            variant="titleMedium"
            style={styles.readingTitle}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text
            variant="bodySmall"
            style={styles.readingAuthor}
            numberOfLines={1}
          >
            {book.author ?? "Autor desconocido"}
          </Text>
          <Text variant="labelSmall" style={styles.readingProgressLabel}>
            Avance: {progress}%
          </Text>
          <ProgressBar
            progress={progress / 100}
            color={theme.colors.primary}
            style={
              isWeb ? styles.readingProgressBar : styles.readingProgressBarMobile
            }
          />
        </View>
        {isWeb && (
          <Ionicons
            name="chevron-forward"
            size={22}
            color={theme.colors.textSoft}
          />
        )}
      </Pressable>
    </Link>
  );
}

const ACQUISITION_CARD_WIDTH = 168;
const acquisitionDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function AcquisitionCard({ item }: { item: PurchaseItem }) {
  let dateStr = "";
  try {
    dateStr = acquisitionDateFormatter.format(new Date(item.purchasedAt));
  } catch {
    dateStr = "";
  }

  return (
    <View style={styles.acquisitionCard}>
      <Text
        variant="titleSmall"
        style={styles.acquisitionTitle}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      <Text style={styles.acquisitionAuthor} numberOfLines={1}>
        {item.author || "Autor no definido"}
      </Text>
      <Text style={styles.acquisitionMeta} numberOfLines={1}>
        {item.price || "—"} · {item.store || "—"}
      </Text>
      <Text style={styles.acquisitionDate}>{dateStr}</Text>
    </View>
  );
}

function LibraryAcquisitionsFooter() {
  const ListComponent: any =
    Constants.appOwnership === "expo" ? FlatList : FlashList;
  const appTheme = useAppTheme();
  const purchases = usePurchases();
  const items = purchases.data ?? [];
  const acquisitionsScrollRef = useRef<ScrollView>(null);
  const [acquisitionsOffset, setAcquisitionsOffset] = useState(0);

  if (purchases.isError) {
    return null;
  }

  return (
    <View style={styles.acquisitionsSection}>
      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: appTheme.colors.textOnDark }]}
      >
        Ultimas adquisiciones
      </Text>
      {purchases.isLoading && !purchases.data ? (
        <Text style={styles.acquisitionsHint}>Cargando...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.acquisitionsHint}>
          Cuando marques deseos como comprados apareceran aqui.
        </Text>
      ) : isWeb ? (
        <View style={styles.webCarouselWrap}>
          <Pressable
            style={styles.webCarouselArrow}
            onPress={() => {
              const next = Math.max(
                0,
                acquisitionsOffset - ACQUISITION_CARD_WIDTH,
              );
              acquisitionsScrollRef.current?.scrollTo({
                x: next,
                animated: true,
              });
            }}
            accessibilityLabel="Desplazar adquisiciones a la izquierda"
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={theme.colors.textOnDark}
            />
          </Pressable>
          <ScrollView
            ref={acquisitionsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.acquisitionsListContent}
            onScroll={(event) =>
              setAcquisitionsOffset(event.nativeEvent.contentOffset.x)
            }
            scrollEventThrottle={16}
          >
            {items.map((item, index) => (
              <Animated.View
                key={`acq-${item.id}`}
                entering={FadeInDown.delay(index * 35).duration(240)}
                exiting={FadeOutLeft.duration(180)}
              >
                <AcquisitionCard item={item} />
              </Animated.View>
            ))}
          </ScrollView>
          <Pressable
            style={styles.webCarouselArrow}
            onPress={() => {
              const next = acquisitionsOffset + ACQUISITION_CARD_WIDTH;
              acquisitionsScrollRef.current?.scrollTo({
                x: next,
                animated: true,
              });
            }}
            accessibilityLabel="Desplazar adquisiciones a la derecha"
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textOnDark}
            />
          </Pressable>
        </View>
      ) : (
        <ListComponent
          horizontal
          data={items}
          keyExtractor={(p: { id: string }) => `acq-${p.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.acquisitionsListContent}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 35).duration(240)}
              exiting={FadeOutLeft.duration(180)}
            >
              <AcquisitionCard item={item} />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

function BookGridCard({ book }: { book: Book }) {
  const year = book.updatedAt ? new Date(book.updatedAt).getFullYear() : null;
  return (
    <Link href={`/(app)/books/${book.id}` as never} asChild>
      <Pressable style={isWeb ? styles.gridCard : styles.gridCardMobile}>
        <BookCover
          uri={book.coverUrl}
          width={GRID_COVER_WIDTH}
          aspectRatio={1.45}
          borderRadius={isWeb ? 6 : 14}
          accessibilityLabel={`Portada: ${book.title}`}
        />
        <View
          style={isWeb ? styles.gridInfoPanel : styles.gridInfoPanelMobile}
        >
          <Text
            variant="labelLarge"
            style={styles.gridCardTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {book.title}
          </Text>
          <Text
            variant="bodySmall"
            style={styles.gridCardAuthor}
            numberOfLines={1}
          >
            {book.author ?? "Autor desconocido"}
          </Text>
          {isWeb && (
            <>
              <View style={styles.gridGenreYearRow}>
                <Text
                  variant="labelSmall"
                  style={styles.gridCardStatus}
                  numberOfLines={1}
                >
                  {book.genre ?? "Sin género"}
                </Text>
                <Text variant="labelSmall" style={styles.gridCardYear}>
                  {year ? String(year) : "----"}
                </Text>
              </View>
              <View style={styles.gridDivider} />
            </>
          )}
          <StarRow rating={book.rating} />
        </View>
      </Pressable>
    </Link>
  );
}

export default function LibraryScreen() {
  const ListComponent: any = FlatList;
  const appTheme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const gridColumns = isWeb
    ? width >= 1500
      ? 5
      : width >= 1220
        ? 4
        : width >= 980
          ? 3
          : 2
    : 2;
  const summary = useBooksSummary();
  const leyendoPreview = useLeyendoPreview();
  const sessionsQuery = useReadingSessionsList();
  const searchDraft = useLibraryPreferencesStore((state) => state.searchDraft);
  const setSearchDraft = useLibraryPreferencesStore(
    (state) => state.setSearchDraft,
  );
  const debouncedSearch = useDebouncedValue(searchDraft, 400);
  const status = useLibraryPreferencesStore((state) => state.status);
  const setStatus = useLibraryPreferencesStore((state) => state.setStatus);
  const shelf = useLibraryPreferencesStore((state) => state.shelf);
  const setShelf = useLibraryPreferencesStore((state) => state.setShelf);
  const genre = useLibraryPreferencesStore((state) => state.genre);
  const setGenre = useLibraryPreferencesStore((state) => state.setGenre);
  const sort = useLibraryPreferencesStore((state) => state.sort);
  const setSort = useLibraryPreferencesStore((state) => state.setSort);
  const showFilters = useLibraryPreferencesStore((state) => state.showFilters);
  const toggleShowFilters = useLibraryPreferencesStore(
    (state) => state.toggleShowFilters,
  );
  const clearFilters = useLibraryPreferencesStore(
    (state) => state.clearFilters,
  );
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const collectionScrollRef = useRef<ScrollView>(null);
  const [collectionOffset, setCollectionOffset] = useState(0);

  const listQuery = useMemo<LibraryBooksQuery>(
    () => ({
      search: debouncedSearch,
      status,
      shelf,
      genre,
      sort,
    }),
    [debouncedSearch, status, shelf, genre, sort],
  );

  const booksFeed = useBooksFeed(listQuery);
  const filtered = isFilteredQuery(listQuery);
  const latestSessionByBook = useMemo(() => {
    const map = new Map<string, { currentPage: number; at: number }>();
    for (const session of sessionsQuery.data ?? []) {
      const at = Date.parse(session.recordedAt || session.createdAt);
      const current = map.get(session.bookId);
      if (!current || at > current.at) {
        map.set(session.bookId, {
          currentPage: Math.max(0, session.currentPage),
          at,
        });
      }
    }
    return map;
  }, [sessionsQuery.data]);

  if (booksFeed.isPending && !booksFeed.data) {
    return <AppLoader />;
  }

  const books = booksFeed.data?.pages.flatMap((page) => page.items) ?? [];
  const collectionSlice = [...books]
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bTime - aTime;
    })
    .slice(0, 10);
  const readingBooks = (leyendoPreview.data ?? [])
    .map((book) => {
      const latest = latestSessionByBook.get(book.id);
      if (!latest || !book.pages || book.pages <= 0) return book;
      const progressFromSession = Math.max(
        0,
        Math.min(100, Math.round((latest.currentPage / book.pages) * 100)),
      );
      return { ...book, progress: progressFromSession };
    })
    .slice(0, 3);
  const genreRows = (summary.data?.genres ?? []).filter(
    (row): row is { genre: string; count: number } =>
      Boolean(row) &&
      typeof row.genre === "string" &&
      Number.isFinite(row.count),
  );

  const ratedCount = summary.data?.ratedCount ?? 0;
  const ratedSum = summary.data?.ratedSum ?? 0;
  const ratingLabel = ratedCount > 0 ? (ratedSum / ratedCount).toFixed(1) : "—";
  const yearLabel = String(summary.data?.latestYear ?? "—");

  const emptyTitle = filtered
    ? "Nada coincide con estos filtros"
    : "Sin libros por ahora";
  const emptyDescription = filtered
    ? "Prueba otra busqueda o pulsa Limpiar filtros."
    : "Cuando agregues libros desde la web o API apareceran aqui.";

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      style={{ paddingHorizontal: 0, paddingTop: 0 }}
    >
      <ListComponent
        data={books}
        keyExtractor={(item: { id: string }) => item.id}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior={isWeb ? "never" : "automatic"}
        refreshControl={
          <RefreshControl
            refreshing={booksFeed.isRefetching}
            onRefresh={booksFeed.refetch}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderOuter}>
            {/* Web: cabecera transparente — espacio manual. Nativo: el stack reserva altura del header. */}
            <View style={{ height: isWeb ? insets.top + 72 : 0 }} />
            <View
              style={[
                styles.listHeader,
                isWeb ? styles.listHeaderWeb : styles.listHeaderMobile,
              ]}
            >
              <StatsStrip
                total={summary.data?.total ?? 0}
                leido={summary.data?.leido ?? 0}
                ratingLabel={ratingLabel}
                yearLabel={yearLabel}
              />

              <View style={styles.searchRow}>
                {isWeb ? (
                  <Searchbar
                    testID="library-searchbar"
                    accessibilityLabel="Buscar en biblioteca"
                    placeholder="Título, autor, género o año..."
                    value={searchDraft}
                    onChangeText={setSearchDraft}
                    style={styles.searchBarFlex}
                    inputStyle={styles.searchInput}
                    placeholderTextColor={theme.colors.text}
                    iconColor={theme.colors.text}
                    elevation={0}
                  />
                ) : (
                  <View style={styles.searchBarMobile}>
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={theme.colors.textSoft}
                      style={{ marginLeft: 12 }}
                    />
                    <TextInput
                      testID="library-searchbar"
                      accessibilityLabel="Buscar en biblioteca"
                      placeholder="Título, autor, género o año..."
                      value={searchDraft}
                      onChangeText={setSearchDraft}
                      style={styles.searchInputMobile}
                      placeholderTextColor={theme.colors.textSoft}
                    />
                  </View>
                )}
                <Pressable
                  onPress={toggleShowFilters}
                  style={[
                    isWeb
                      ? styles.filterIconBtn
                      : styles.filterIconBtnMobile,
                    showFilters && styles.filterIconBtnActive,
                  ]}
                  accessibilityLabel={
                    showFilters ? "Ocultar filtros" : "Mostrar filtros"
                  }
                >
                  <Ionicons
                    name="options-outline"
                    size={isWeb ? 22 : 18}
                    color={
                      showFilters ? theme.colors.onPrimary : theme.colors.accent
                    }
                  />
                </Pressable>
              </View>

              {showFilters ? (
                <View style={styles.filtersBlock}>
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.filterSectionLabel,
                      { color: appTheme.colors.textMutedOnDark },
                    ]}
                  >
                    Estado en lista
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {STATUS_OPTIONS.map((opt) =>
                      isWeb ? (
                        <Chip
                          key={opt.key}
                          compact
                          selected={status === opt.key}
                          onPress={() => setStatus(opt.key)}
                          style={{
                            backgroundColor:
                              status === opt.key
                                ? appTheme.colors.primary
                                : appTheme.colors.bgPanel,
                          }}
                          textStyle={[
                            styles.filterChipLabel,
                            {
                              color:
                                status === opt.key
                                  ? appTheme.colors.onPrimary
                                  : appTheme.colors.textOnDark,
                            },
                          ]}
                        >
                          {opt.label}
                        </Chip>
                      ) : (
                        <Pressable
                          key={opt.key}
                          onPress={() => setStatus(opt.key)}
                          style={[
                            styles.filterPillMobile,
                            status === opt.key &&
                              styles.filterPillMobileActive,
                          ]}
                        >
                          <NativeText
                            style={[
                              styles.filterPillTextMobile,
                              status === opt.key &&
                                styles.filterPillTextMobileActive,
                            ]}
                          >
                            {opt.label}
                          </NativeText>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.filterSectionLabel,
                      { color: appTheme.colors.textMutedOnDark },
                    ]}
                  >
                    Coleccion
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {SHELF_OPTIONS.map((opt) =>
                      isWeb ? (
                        <Chip
                          key={opt.key}
                          compact
                          selected={shelf === opt.key}
                          onPress={() => setShelf(opt.key)}
                          style={{
                            backgroundColor:
                              shelf === opt.key
                                ? appTheme.colors.primary
                                : appTheme.colors.bgPanel,
                          }}
                          textStyle={[
                            styles.filterChipLabel,
                            {
                              color:
                                shelf === opt.key
                                  ? appTheme.colors.onPrimary
                                  : appTheme.colors.textOnDark,
                            },
                          ]}
                        >
                          {opt.label}
                        </Chip>
                      ) : (
                        <Pressable
                          key={opt.key}
                          onPress={() => setShelf(opt.key)}
                          style={[
                            styles.filterPillMobile,
                            shelf === opt.key &&
                              styles.filterPillMobileActive,
                          ]}
                        >
                          <NativeText
                            style={[
                              styles.filterPillTextMobile,
                              shelf === opt.key &&
                                styles.filterPillTextMobileActive,
                            ]}
                          >
                            {opt.label}
                          </NativeText>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>
                  <View style={styles.actionsRow}>
                    {isWeb ? (
                      <Button
                        mode="outlined"
                        compact
                        textColor={appTheme.colors.textOnDark}
                        onPress={() => setGenreModalOpen(true)}
                        style={[
                          styles.actionBtn,
                          styles.actionBtnHalf,
                          { borderColor: appTheme.colors.accent },
                        ]}
                        labelStyle={[
                          styles.actionBtnLabel,
                          { color: appTheme.colors.textOnDark },
                        ]}
                        contentStyle={styles.actionBtnContent}
                      >
                        Género:{" "}
                        {genre
                          ? genre.length > 10
                            ? `${genre.slice(0, 10)}…`
                            : genre
                          : "Todos"}
                      </Button>
                    ) : (
                      <Pressable
                        onPress={() => setGenreModalOpen(true)}
                        style={[styles.actionBtnMobile, styles.actionBtnHalf]}
                      >
                        <NativeText
                          style={styles.actionBtnLabelMobile}
                          numberOfLines={1}
                        >
                          Género:{" "}
                          {genre
                            ? genre.length > 10
                              ? `${genre.slice(0, 10)}…`
                              : genre
                            : "Todos"}
                        </NativeText>
                      </Pressable>
                    )}
                    {isWeb ? (
                      <Button
                        mode="outlined"
                        compact
                        textColor={appTheme.colors.textOnDark}
                        onPress={() => setSortModalOpen(true)}
                        style={[
                          styles.actionBtn,
                          styles.actionBtnHalf,
                          { borderColor: appTheme.colors.accent },
                        ]}
                        labelStyle={[
                          styles.actionBtnLabel,
                          { color: appTheme.colors.textOnDark },
                        ]}
                        contentStyle={styles.actionBtnContent}
                      >
                        Orden: {SORT_LABELS[sort]}
                      </Button>
                    ) : (
                      <Pressable
                        onPress={() => setSortModalOpen(true)}
                        style={[styles.actionBtnMobile, styles.actionBtnHalf]}
                      >
                        <NativeText
                          style={styles.actionBtnLabelMobile}
                          numberOfLines={1}
                        >
                          Orden: {SORT_LABELS[sort]}
                        </NativeText>
                      </Pressable>
                    )}
                  </View>
                  {filtered ? (
                    <Button
                      mode="text"
                      compact
                      onPress={clearFilters}
                      textColor={theme.colors.primary}
                      labelStyle={styles.clearFiltersLabel}
                    >
                      Limpiar filtros
                    </Button>
                  ) : null}
                </View>
              ) : null}

              {collectionSlice.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    {isWeb ? (
                      <Text
                        variant="titleLarge"
                        style={[
                          styles.sectionTitle,
                          { color: appTheme.colors.textOnDark },
                        ]}
                      >
                        Colección
                      </Text>
                    ) : (
                      <NativeText style={styles.sectionTitleMobile}>
                        Colección
                      </NativeText>
                    )}
                  </View>
                  {isWeb ? (
                    <View style={styles.webCarouselWrap}>
                      <Pressable
                        style={styles.webCarouselArrow}
                        onPress={() => {
                          const next = Math.max(
                            0,
                            collectionOffset - COLLECTION_CARD_WIDTH,
                          );
                          collectionScrollRef.current?.scrollTo({
                            x: next,
                            animated: true,
                          });
                        }}
                        accessibilityLabel="Desplazar colección a la izquierda"
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={theme.colors.textOnDark}
                        />
                      </Pressable>
                      <ScrollView
                        ref={collectionScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.collectionListContent}
                        onScroll={(event) =>
                          setCollectionOffset(event.nativeEvent.contentOffset.x)
                        }
                        scrollEventThrottle={16}
                      >
                        {collectionSlice.map((item, index) => (
                          <Animated.View
                            key={`c-${item.id}`}
                            entering={FadeInDown.delay(index * 35).duration(
                              260,
                            )}
                            exiting={FadeOutLeft.duration(180)}
                          >
                            <CollectionBookCard book={item} />
                          </Animated.View>
                        ))}
                      </ScrollView>
                      <Pressable
                        style={styles.webCarouselArrow}
                        onPress={() => {
                          const next = collectionOffset + COLLECTION_CARD_WIDTH;
                          collectionScrollRef.current?.scrollTo({
                            x: next,
                            animated: true,
                          });
                        }}
                        accessibilityLabel="Desplazar colección a la derecha"
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={theme.colors.textOnDark}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <ListComponent
                      horizontal
                      data={collectionSlice}
                      keyExtractor={(item: { id: string }) => `c-${item.id}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.collectionListContent}
                      renderItem={({
                        item,
                        index,
                      }: {
                        item: any;
                        index: number;
                      }) => (
                        <Animated.View
                          entering={FadeInDown.delay(index * 35).duration(260)}
                          exiting={FadeOutLeft.duration(180)}
                        >
                          <CollectionBookCard book={item} />
                        </Animated.View>
                      )}
                    />
                  )}
                </View>
              ) : null}

              {readingBooks.length > 0 ? (
                <View style={styles.section}>
                  {isWeb ? (
                    <Text
                      variant="titleLarge"
                      style={[
                        styles.sectionTitle,
                        { color: appTheme.colors.textOnDark },
                      ]}
                    >
                      Leyendo ahora
                    </Text>
                  ) : (
                    <NativeText style={styles.sectionTitleMobile}>
                      Leyendo ahora
                    </NativeText>
                  )}
                  <View style={styles.readingStack}>
                    {readingBooks.map((book, index) => (
                      <Animated.View
                        key={book.id}
                        entering={FadeInDown.delay(index * 40).duration(260)}
                        exiting={FadeOutLeft.duration(180)}
                      >
                        <ReadingNowCard book={book} />
                      </Animated.View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.section}>
                {isWeb ? (
                  <Text
                    variant="titleLarge"
                    style={[styles.sectionTitleStrong, { color: appTheme.colors.textOnDark }]}
                  >
                    Tus libros
                  </Text>
                ) : (
                  <NativeText style={styles.sectionTitleMobile}>
                    Tus libros
                  </NativeText>
                )}
              </View>
            </View>
          </View>
        }
        numColumns={gridColumns}
        key={`library-grid-${gridColumns}`}
        columnWrapperStyle={styles.gridColumn}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 20).duration(220)}
            exiting={FadeOutLeft.duration(180)}
            style={styles.gridItemWrap}
          >
            <BookGridCard book={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.listRowOuter}>
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </View>
        }
        ListFooterComponent={
          <View style={styles.listFooterWrap}>
            {booksFeed.hasNextPage ? (
              isWeb ? (
                <Button
                  mode="contained"
                  style={styles.loadMoreButton}
                  onPress={() => booksFeed.fetchNextPage()}
                  disabled={booksFeed.isFetchingNextPage}
                >
                  {booksFeed.isFetchingNextPage ? "Cargando..." : "Cargar mas"}
                </Button>
              ) : (
                <Pressable
                  style={[
                    styles.loadMoreButtonMobile,
                    booksFeed.isFetchingNextPage && { opacity: 0.6 },
                  ]}
                  onPress={() => booksFeed.fetchNextPage()}
                  disabled={booksFeed.isFetchingNextPage}
                >
                  <NativeText style={styles.loadMoreLabelMobile}>
                    {booksFeed.isFetchingNextPage
                      ? "Cargando..."
                      : "Cargar mas"}
                  </NativeText>
                </Pressable>
              )
            ) : null}
            <LibraryAcquisitionsFooter />
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.listContentWeb,
          { paddingBottom: 24 + insets.bottom },
        ]}
      />

      <Modal
        visible={sortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalOpen(false)}
      >
        <View style={isWeb ? styles.modalRoot : styles.modalRootMobile}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSortModalOpen(false)}
          />
          <View style={isWeb ? styles.genreSheet : styles.genreSheetMobile}>
            <Text variant="titleMedium" style={styles.genreSheetTitle}>
              Ordenar por
            </Text>
            <ListComponent
              style={styles.sortList}
              data={SORT_OPTIONS}
              keyExtractor={(item: { key: string }) => item.key}
              ItemSeparatorComponent={() => <View style={styles.genreSep} />}
              renderItem={({ item }: { item: any }) => {
                const active = sort === item.key;
                return (
                  <Pressable
                    style={styles.genreRow}
                    onPress={() => {
                      setSort(item.key);
                      setSortModalOpen(false);
                    }}
                  >
                    <Text
                      variant="bodyLarge"
                      style={[
                        styles.genreRowLabel,
                        active ? styles.genreRowActive : null,
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <Text
                        style={styles.sortCheck}
                        accessibilityLabel="Seleccionado"
                      >
                        ✓
                      </Text>
                    ) : (
                      <View style={styles.sortCheckSpacer} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={genreModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalOpen(false)}
      >
        <View style={isWeb ? styles.modalRoot : styles.modalRootMobile}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setGenreModalOpen(false)}
          />
          <View style={isWeb ? styles.genreSheet : styles.genreSheetMobile}>
            <Text variant="titleMedium" style={styles.genreSheetTitle}>
              Género
            </Text>
            <ListComponent
              style={styles.genreList}
              data={[
                { genre: "__all__", count: summary.data?.total ?? 0 },
                ...genreRows.map((g) => ({ genre: g.genre, count: g.count })),
              ]}
              keyExtractor={(item: { genre: string }) => item.genre}
              ItemSeparatorComponent={() => <View style={styles.genreSep} />}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  style={styles.genreRow}
                  onPress={() => {
                    if (item.genre === "__all__") setGenre(null);
                    else setGenre(item.genre);
                    setGenreModalOpen(false);
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.genreRowLabel,
                      genre === item.genre ||
                      (item.genre === "__all__" && !genre)
                        ? styles.genreRowActive
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {item.genre === "__all__"
                      ? "Todos los géneros"
                      : item.genre}
                  </Text>
                  <Text variant="labelMedium" style={styles.genreRowCount}>
                    {item.count}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    gap: 0,
  },
  listContentWeb: {
    paddingHorizontal: 18,
  },
  listHeaderOuter: {
    alignSelf: "stretch",
    width: "100%",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 12,
  },
  listHeaderWeb: {
    width: "100%",
    maxWidth: 1220,
    alignSelf: "center",
  },
  listHeaderMobile: {
    paddingHorizontal: 14,
    gap: 16,
  },
  listRowOuter: {
    paddingHorizontal: 16,
  },
  listFooterWrap: {
    gap: 20,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  acquisitionsSection: {
    gap: 10,
    marginBottom: 8,
  },
  acquisitionsListContent: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  webCarouselWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webCarouselArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  acquisitionsHint: {
    color: theme.colors.textMutedOnDark,
    fontSize: 14,
    lineHeight: 20,
  },
  acquisitionCard: {
    width: ACQUISITION_CARD_WIDTH,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    gap: 4,
  },
  acquisitionTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    lineHeight: 18,
  },
  acquisitionAuthor: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontStyle: "italic",
  },
  acquisitionMeta: {
    color: theme.colors.textSoft,
    fontSize: 11,
    marginTop: 2,
  },
  acquisitionDate: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: "Fraunces_700Bold",
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statsCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  statsCellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.borderOnCard,
  },
  statsIcon: {
    marginBottom: 2,
  },
  statsValue: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.text,
  },
  statsLabel: {
    fontSize: 8,
    letterSpacing: 0.4,
    color: theme.colors.textSoft,
    marginTop: 1,
    textAlign: "center",
  },
  statsRowMobile: {
    flexDirection: "row",
    gap: 8,
  },
  statsCellMobile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  statsValueMobile: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: theme.colors.text,
  },
  statsLabelMobile: {
    fontSize: 8,
    letterSpacing: 0.4,
    color: theme.colors.textSoft,
    marginTop: 1,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBarFlex: {
    flex: 1,
    minHeight: 44,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  searchInput: {
    fontFamily: "Fraunces_400Regular",
    minHeight: 40,
    fontSize: 14,
    color: theme.colors.text,
    opacity: 1,
  },
  searchBarMobile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  searchInputMobile: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    color: theme.colors.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  filterIconBtnMobile: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  filterIconBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filtersBlock: {
    gap: 6,
  },
  filterSectionLabel: {
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
    paddingRight: 4,
  },
  filterChipLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  filterPillMobile: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  filterPillMobileActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillTextMobile: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.text,
  },
  filterPillTextMobileActive: {
    color: theme.colors.onPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    marginTop: 2,
    alignItems: "stretch",
  },
  actionBtn: {
    borderRadius: 999,
  },
  actionBtnHalf: {
    flex: 1,
    minWidth: 0,
  },
  actionBtnContent: {
    minHeight: 32,
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  actionBtnLabel: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "none",
  },
  actionBtnMobile: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabelMobile: {
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.text,
    fontFamily: "Fraunces_400Regular",
  },
  clearFiltersLabel: {
    fontSize: 12,
  },
  section: {
    marginTop: 4,
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.textOnDark,
    letterSpacing: 0.2,
  },
  sectionTitleStrong: {
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 0.2,
  },
  sectionTitleMobile: {
    fontSize: 20,
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  collectionListContent: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  collectionCard: {
    width: COLLECTION_CARD_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  collectionCardMobile: {
    width: COLLECTION_CARD_WIDTH_MOBILE,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  collectionCoverWrap: {
    position: "relative",
    backgroundColor: theme.colors.bgSoft,
  },
  collectionHeart: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(35, 25, 16, 0.35)",
    borderRadius: 999,
    padding: 4,
  },
  collectionMeta: {
    padding: 10,
    gap: 4,
  },
  collectionTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    lineHeight: 18,
  },
  collectionAuthor: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontStyle: "italic",
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  readingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  readingCardMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  readingBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  readingTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
  },
  readingAuthor: {
    color: theme.colors.textSoft,
  },
  readingProgressLabel: {
    color: theme.colors.textSoft,
    marginTop: 2,
  },
  readingProgressBar: {
    height: 6,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: theme.colors.bgSoft,
  },
  readingProgressBarMobile: {
    height: 8,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: theme.colors.bgSoft,
  },
  readingStack: {
    gap: 10,
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  gridColumn: {
    gap: 10,
  },
  gridItemWrap: {
    flex: 1,
    minWidth: 0,
    marginBottom: 12,
  },
  gridCard: {
    overflow: "visible",
    height: 356,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  gridCardMobile: {
    overflow: "visible",
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  gridInfoPanel: {
    width: GRID_COVER_WIDTH,
    minWidth: 0,
    gap: 4,
    marginTop: 0,
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    borderTopWidth: 0,
  },
  gridInfoPanelMobile: {
    width: GRID_COVER_WIDTH,
    minWidth: 0,
    gap: 3,
    marginTop: 0,
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  gridCardTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    lineHeight: 18,
  },
  gridCardAuthor: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  gridGenreYearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  gridCardStatus: {
    color: theme.colors.textSoft,
    fontSize: 11,
    textTransform: "uppercase",
    flex: 1,
  },
  gridCardYear: {
    color: theme.colors.textSoft,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: "Fraunces_700Bold",
  },
  gridDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderOnCard,
    marginTop: 2,
    marginBottom: 2,
  },
  loadMoreButton: {
    marginTop: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  loadMoreButtonMobile: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreLabelMobile: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
  },
  modalRootMobile: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 11, 6, 0.45)",
  },
  genreSheet: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    marginHorizontal: 16,
    maxHeight: "85%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  genreSheetMobile: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  genreSheetTitle: {
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  genreList: {
    maxHeight: 360,
  },
  sortList: {
    maxHeight: 280,
  },
  sortCheck: {
    width: 24,
    textAlign: "center",
    fontSize: 16,
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
  },
  sortCheckSpacer: {
    width: 24,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  genreRowLabel: {
    flex: 1,
    color: theme.colors.text,
    marginRight: 12,
  },
  genreRowActive: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.primary,
  },
  genreRowCount: {
    color: theme.colors.textSoft,
  },
  genreSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderOnCard,
    marginLeft: 12,
  },
});
