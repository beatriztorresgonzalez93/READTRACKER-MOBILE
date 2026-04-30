// Pantalla principal de biblioteca con filtros, resumen y coleccion.
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

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

const COLLECTION_CARD_WIDTH = 146;
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
  const h = Math.round(COLLECTION_CARD_WIDTH * COLLECTION_COVER_RATIO);
  return (
    <Link href={`/(app)/books/${book.id}` as never} asChild>
      <Pressable style={styles.collectionCard}>
        <View style={[styles.collectionCoverWrap, { height: h }]}>
          <BookCover
            uri={book.coverUrl}
            width={COLLECTION_CARD_WIDTH}
            aspectRatio={COLLECTION_COVER_RATIO}
            borderRadius={4}
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
      <Pressable style={styles.readingCard}>
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
            style={styles.readingProgressBar}
          />
        </View>
        <Ionicons
          name="chevron-forward"
          size={22}
          color={theme.colors.textSoft}
        />
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
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;
  const appTheme = useAppTheme();
  const purchases = usePurchases();
  const items = purchases.data ?? [];

  if (purchases.isError) {
    return null;
  }

  return (
    <View style={styles.acquisitionsSection}>
      <Text variant="titleLarge" style={[styles.sectionTitle, { color: appTheme.colors.textOnDark }]}>
        Ultimas adquisiciones
      </Text>
      {purchases.isLoading && !purchases.data ? (
        <Text style={styles.acquisitionsHint}>Cargando...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.acquisitionsHint}>
          Cuando marques deseos como comprados apareceran aqui.
        </Text>
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
      <Pressable style={styles.gridCard}>
        <BookCover
          uri={book.coverUrl}
          width={GRID_COVER_WIDTH}
          aspectRatio={1.45}
          borderRadius={6}
          accessibilityLabel={`Portada: ${book.title}`}
        />
        <View style={styles.gridInfoPanel}>
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
          <StarRow rating={book.rating} />
        </View>
      </Pressable>
    </Link>
  );
}

export default function LibraryScreen() {
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;
  const appTheme = useAppTheme();
  const insets = useSafeAreaInsets();
  const summary = useBooksSummary();
  const leyendoPreview = useLeyendoPreview();
  const sessionsQuery = useReadingSessionsList();
  const searchDraft = useLibraryPreferencesStore((state) => state.searchDraft);
  const setSearchDraft = useLibraryPreferencesStore((state) => state.setSearchDraft);
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
  const toggleShowFilters = useLibraryPreferencesStore((state) => state.toggleShowFilters);
  const clearFilters = useLibraryPreferencesStore((state) => state.clearFilters);
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

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
        map.set(session.bookId, { currentPage: Math.max(0, session.currentPage), at });
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
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={booksFeed.isRefetching}
            onRefresh={booksFeed.refetch}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderOuter}>
            <View style={{ height: insets.top + 70 }} />
            <View style={styles.listHeader}>
              <StatsStrip
                total={summary.data?.total ?? 0}
                leido={summary.data?.leido ?? 0}
                ratingLabel={ratingLabel}
                yearLabel={yearLabel}
              />

              <View style={styles.searchRow}>
                <Searchbar
                  testID="library-searchbar"
                  accessibilityLabel="Buscar en biblioteca"
                  placeholder="Título, autor, género o año..."
                  value={searchDraft}
                  onChangeText={setSearchDraft}
                  style={styles.searchBarFlex}
                  inputStyle={styles.searchInput}
                  placeholderTextColor={theme.colors.textSoft}
                  iconColor={theme.colors.textSoft}
                  elevation={0}
                />
                <Pressable
                  onPress={toggleShowFilters}
                  style={[
                    styles.filterIconBtn,
                    showFilters && styles.filterIconBtnActive,
                  ]}
                  accessibilityLabel={
                    showFilters ? "Ocultar filtros" : "Mostrar filtros"
                  }
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={
                      showFilters ? theme.colors.onPrimary : theme.colors.accent
                    }
                  />
                </Pressable>
              </View>

              {showFilters ? (
                <View style={styles.filtersBlock}>
                  <Text variant="labelMedium" style={styles.filterSectionLabel}>
                    Estado en lista
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.key}
                        compact
                        selected={status === opt.key}
                        onPress={() => setStatus(opt.key)}
                        style={[
                          styles.filterChip,
                          status === opt.key && styles.filterChipSelected,
                        ]}
                        textStyle={
                          status === opt.key
                            ? styles.filterChipTextSelected
                            : styles.filterChipText
                        }
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </ScrollView>
                  <Text variant="labelMedium" style={styles.filterSectionLabel}>
                    Coleccion
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {SHELF_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.key}
                        compact
                        selected={shelf === opt.key}
                        onPress={() => setShelf(opt.key)}
                        style={[
                          styles.filterChip,
                          shelf === opt.key && styles.filterChipSelected,
                        ]}
                        textStyle={
                          shelf === opt.key
                            ? styles.filterChipTextSelected
                            : styles.filterChipText
                        }
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </ScrollView>
                  <View style={styles.actionsRow}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setGenreModalOpen(true)}
                      style={[styles.actionBtn, styles.actionBtnHalf]}
                      labelStyle={[styles.actionBtnLabel, { color: appTheme.colors.textOnDark }]}
                      contentStyle={styles.actionBtnContent}
                    >
                      Género:{" "}
                      {genre
                        ? genre.length > 10
                          ? `${genre.slice(0, 10)}…`
                          : genre
                        : "Todos"}
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setSortModalOpen(true)}
                      style={[styles.actionBtn, styles.actionBtnHalf]}
                      labelStyle={[styles.actionBtnLabel, { color: appTheme.colors.textOnDark }]}
                      contentStyle={styles.actionBtnContent}
                    >
                      Orden: {SORT_LABELS[sort]}
                    </Button>
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
                    <Text variant="titleLarge" style={[styles.sectionTitle, { color: appTheme.colors.textOnDark }]}>
                      Colección
                    </Text>
                  </View>
                  <ListComponent
                    horizontal
                    data={collectionSlice}
                    keyExtractor={(item: { id: string }) => `c-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.collectionListContent}
                    renderItem={({ item, index }: { item: any; index: number }) => (
                      <Animated.View
                        entering={FadeInDown.delay(index * 35).duration(260)}
                        exiting={FadeOutLeft.duration(180)}
                      >
                        <CollectionBookCard book={item} />
                      </Animated.View>
                    )}
                  />
                </View>
              ) : null}

              {readingBooks.length > 0 ? (
                <View style={styles.section}>
                  <Text variant="titleLarge" style={[styles.sectionTitle, { color: appTheme.colors.textOnDark }]}>
                    Leyendo ahora
                  </Text>
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
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Tus libros
                </Text>
              </View>
            </View>
          </View>
        }
        numColumns={2}
        key={"library-grid-2"}
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
              <Button
                mode="contained"
                style={styles.loadMoreButton}
                onPress={() => booksFeed.fetchNextPage()}
                disabled={booksFeed.isFetchingNextPage}
              >
                {booksFeed.isFetchingNextPage ? "Cargando..." : "Cargar mas"}
              </Button>
            ) : null}
            <LibraryAcquisitionsFooter />
          </View>
        }
        contentContainerStyle={{ ...styles.listContent, paddingBottom: 24 + insets.bottom }}
      />

      <Modal
        visible={sortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSortModalOpen(false)}
          />
          <View style={styles.genreSheet}>
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
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setGenreModalOpen(false)}
          />
          <View style={styles.genreSheet}>
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
  /** Contenedor del FlatList: sin padding horizontal para que el header llegue a los bordes. */
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    gap: 0,
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
    color: theme.colors.textSoft,
    opacity: 0.9,
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
  filterIconBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filtersBlock: {
    gap: 6,
  },
  filterSectionLabel: {
    color: theme.colors.textMutedOnDark,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
    paddingRight: 4,
  },
  filterChip: {
    backgroundColor: theme.colors.bgPanel,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textOnDark,
    fontFamily: "Fraunces_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  filterChipTextSelected: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    marginTop: 2,
    alignItems: "stretch",
  },
  actionBtn: {
    borderColor: theme.colors.accent,
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
  readingStack: {
    gap: 10,
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  gridItemWrap: {
    flex: 1,
    minWidth: 0,
  },
  gridCard: {
    overflow: "visible",
    height: 378,
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
  modalRoot: {
    flex: 1,
    justifyContent: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 11, 6, 0.45)",
  },
  genreSheet: {
    marginHorizontal: 16,
    maxHeight: "85%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
