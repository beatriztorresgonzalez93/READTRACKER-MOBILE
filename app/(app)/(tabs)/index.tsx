// Pantalla principal de biblioteca con filtros, resumen y listado de libros.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  Chip,
  Searchbar,
  Text,
} from "react-native-paper";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useBooksFeed,
  useBooksSummary,
} from "@/features/books/use-books";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type {
  Book,
  BooksSortKey,
  LibraryBooksQuery,
  LibraryShelfFilter,
  LibraryStatusFilter,
} from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
import { useLibraryPreferencesStore } from "@store/library-preferences";

const isWeb = Platform.OS === "web";

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

  const loadMoreBooks = useCallback(() => {
    if (booksFeed.hasNextPage && !booksFeed.isFetchingNextPage) {
      void booksFeed.fetchNextPage();
    }
  }, [booksFeed.hasNextPage, booksFeed.isFetchingNextPage, booksFeed.fetchNextPage]);

  if (booksFeed.isPending && !booksFeed.data) {
    return <AppLoader />;
  }

  const books = booksFeed.data?.pages.flatMap((page) => page.items) ?? [];
  const genreRows = (summary.data?.genres ?? []).filter(
    (row): row is { genre: string; count: number } =>
      Boolean(row) &&
      typeof row.genre === "string" &&
      Number.isFinite(row.count),
  );

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
                  onPress={() => {
                    if (isWeb) {
                      toggleShowFilters();
                    } else {
                      router.push("/(app)/library-filters" as never);
                    }
                  }}
                  style={[
                    isWeb
                      ? styles.filterIconBtn
                      : styles.filterIconBtnMobile,
                    (isWeb ? showFilters : filtered) && styles.filterIconBtnActive,
                  ]}
                  accessibilityLabel={
                    isWeb
                      ? showFilters
                        ? "Ocultar filtros"
                        : "Mostrar filtros"
                      : "Abrir filtros de biblioteca"
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

              <Pressable
                onPress={() => router.push("/(app)/books/new" as never)}
                style={[
                  styles.addBookBtn,
                  isWeb ? styles.addBookBtnWeb : styles.addBookBtnMobile,
                  { backgroundColor: appTheme.colors.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Añadir libro"
              >
                <Ionicons name="add" size={20} color={appTheme.colors.onPrimary} />
                <NativeText style={[styles.addBookBtnLabel, { color: appTheme.colors.onPrimary }]}>
                  Añadir libro
                </NativeText>
              </Pressable>

              {isWeb && showFilters ? (
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
        renderItem={({ item, index }: { item: any; index: number }) =>
          isWeb ? (
            <View style={styles.gridItemWrap}>
              <BookGridCard book={item} />
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(index * 20).duration(220)}
              exiting={FadeOutLeft.duration(180)}
              style={styles.gridItemWrap}
            >
              <BookGridCard book={item} />
            </Animated.View>
          )
        }
        ListEmptyComponent={
          <View style={styles.listRowOuter}>
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </View>
        }
        onEndReached={loadMoreBooks}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          booksFeed.isFetchingNextPage ? (
            <View style={styles.listFooterWrap}>
              <ActivityIndicator size="small" color={appTheme.colors.primary} />
            </View>
          ) : (
            <View style={styles.listFooterSpacer} />
          )
        }
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.listContentWeb,
          { paddingBottom: 24 + insets.bottom },
        ]}
      />

      {isWeb ? (
        <>
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
        </>
      ) : null}
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  listFooterSpacer: {
    height: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBookBtnWeb: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addBookBtnMobile: {
    paddingVertical: 12,
    borderRadius: 14,
  },
  addBookBtnLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
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
  starRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
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
