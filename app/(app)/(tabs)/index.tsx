// Biblioteca: búsqueda, filtros y grid de libros (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LIBRARY_SHELF_LABELS,
  LIBRARY_SORT_LABELS,
  LIBRARY_STATUS_LABELS,
} from "@/features/books/library-filter-labels";
import {
  getLibraryPrefetchThresholdIndex,
  useBooksFeed,
} from "@/features/books/use-books";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { Book, LibraryBooksQuery } from "@/shared/types/books";
import { AppButton } from "@/shared/ui/app-button";
import { AppLink } from "@/shared/ui/app-link";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { ActiveFilterChips, type ActiveFilterChip } from "@/shared/ui/active-filter-chips";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { useLibraryPreferencesStore } from "@store/library-preferences";

const isWeb = Platform.OS === "web";
const GRID_COVER_WIDTH = 168;

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
    <HStack space="xs" mt="$0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? "star" : "star-outline"}
          size={14}
          color="#A87D42"
        />
      ))}
    </HStack>
  );
}

function BookGridCard({ book }: { book: Book }) {
  const year = book.updatedAt ? new Date(book.updatedAt).getFullYear() : null;

  return (
    <AppLink
      href={`/(app)/books/${book.id}` as never}
      style={isWeb ? styles.gridCard : styles.gridCardMobile}
    >
        <BookCover
          uri={book.coverUrl}
          title={book.title}
          width={GRID_COVER_WIDTH}
        aspectRatio={1.45}
        borderRadius={isWeb ? 6 : 14}
        accessibilityLabel={`Portada: ${book.title}`}
      />
      <Box
        width={GRID_COVER_WIDTH}
        bg="$white"
        borderBottomLeftRadius={isWeb ? "$sm" : "$lg"}
        borderBottomRightRadius={isWeb ? "$sm" : "$lg"}
        px="$2"
        pt="$2"
        pb="$2"
        gap={4}
        borderWidth={isWeb ? 1 : 0}
        borderTopWidth={0}
        borderColor="$primary200"
      >
        <Text size="sm" fontWeight="$bold" color="$primary800" numberOfLines={1}>
          {book.title}
        </Text>
        <Text size="xs" color="$textLight500" numberOfLines={1}>
          {book.author ?? "Autor desconocido"}
        </Text>
        {isWeb ? (
          <>
            <HStack justifyContent="space-between" alignItems="center" gap="$2">
              <Text size="2xs" color="$textLight500" textTransform="uppercase" flex={1} numberOfLines={1}>
                {book.genre ?? "Sin género"}
              </Text>
              <Text size="2xs" fontWeight="$bold" color="$textLight500" letterSpacing={1}>
                {year ? String(year) : "----"}
              </Text>
            </HStack>
            <Box h={1} bg="$primary200" my="$0.5" />
          </>
        ) : null}
        <StarRow rating={book.rating} />
      </Box>
    </AppLink>
  );
}

export default function LibraryScreen() {
  const ListComponent: typeof FlatList = FlatList;
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

  const searchDraft = useLibraryPreferencesStore((state) => state.searchDraft);
  const setSearchDraft = useLibraryPreferencesStore((state) => state.setSearchDraft);
  const status = useLibraryPreferencesStore((state) => state.status);
  const setStatus = useLibraryPreferencesStore((state) => state.setStatus);
  const shelf = useLibraryPreferencesStore((state) => state.shelf);
  const setShelf = useLibraryPreferencesStore((state) => state.setShelf);
  const genre = useLibraryPreferencesStore((state) => state.genre);
  const setGenre = useLibraryPreferencesStore((state) => state.setGenre);
  const sort = useLibraryPreferencesStore((state) => state.sort);
  const setSort = useLibraryPreferencesStore((state) => state.setSort);

  const debouncedSearch = useDebouncedValue(searchDraft, 400);

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

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (status !== "todos") {
      chips.push({
        id: "status",
        label: LIBRARY_STATUS_LABELS[status],
        onRemove: () => setStatus("todos"),
      });
    }
    if (shelf !== "todos") {
      chips.push({
        id: "shelf",
        label: LIBRARY_SHELF_LABELS[shelf],
        onRemove: () => setShelf("todos"),
      });
    }
    if (genre) {
      chips.push({
        id: "genre",
        label: genre,
        onRemove: () => setGenre(null),
      });
    }
    if (sort !== "recientes") {
      chips.push({
        id: "sort",
        label: LIBRARY_SORT_LABELS[sort],
        onRemove: () => setSort("recientes"),
      });
    }
    return chips;
  }, [genre, setGenre, setShelf, setSort, setStatus, shelf, sort, status]);

  const loadMoreBooks = useCallback(() => {
    if (booksFeed.hasNextPage && !booksFeed.isFetchingNextPage) {
      void booksFeed.fetchNextPage();
    }
  }, [booksFeed.hasNextPage, booksFeed.isFetchingNextPage, booksFeed.fetchNextPage]);

  const books = booksFeed.data?.pages.flatMap((page) => page.items) ?? [];
  const prefetchThresholdRef = useRef(-1);

  useEffect(() => {
    prefetchThresholdRef.current = -1;
  }, [listQuery]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (books.length === 0) {
        return;
      }
      const maxVisibleIndex = viewableItems.reduce(
        (max, entry) => (entry.index != null && entry.index > max ? entry.index : max),
        -1,
      );
      const threshold = getLibraryPrefetchThresholdIndex(books.length);
      if (maxVisibleIndex < threshold || threshold === prefetchThresholdRef.current) {
        return;
      }
      prefetchThresholdRef.current = threshold;
      loadMoreBooks();
    },
    [books.length, loadMoreBooks],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 20 }).current;

  if (booksFeed.isPending && !booksFeed.data) {
    return <AppLoader />;
  }

  const emptyTitle = filtered ? "Nada coincide con estos filtros" : "Sin libros por ahora";
  const emptyDescription = filtered
    ? "Prueba otra busqueda o abre Filtros para ajustar la lista."
    : "Cuando agregues libros apareceran aqui. Pulsa Añadir libro para empezar.";

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{ paddingHorizontal: 0, paddingTop: 0 }}
    >
      <ListComponent
        data={books}
        keyExtractor={(item: Book) => item.id}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior={isWeb ? "never" : "automatic"}
        refreshControl={
          <RefreshControl
            refreshing={booksFeed.isRefetching}
            onRefresh={booksFeed.refetch}
            tintColor="#A87D42"
            colors={["#A87D42"]}
          />
        }
        ListHeaderComponent={
          <Box width="100%" alignSelf="stretch">
            <Box h={isWeb ? insets.top + 72 : 0} />
            <VStack
              px={isWeb ? "$4" : "$3"}
              pt="$1"
              pb="$2"
              space="md"
              width="100%"
              maxWidth={1220}
              alignSelf="center"
            >
              <HStack alignItems="center" space="sm">
                <Input
                  flex={1}
                  size="lg"
                  variant="outline"
                  borderRadius={isWeb ? "$md" : "$lg"}
                  bg="$white"
                  borderColor="$primary200"
                >
                  <InputSlot pl="$3">
                    <Ionicons name="search-outline" size={18} color="#7A6555" />
                  </InputSlot>
                  <InputField
                    testID="library-searchbar"
                    accessibilityLabel="Buscar en biblioteca"
                    placeholder="Título, autor, género o año..."
                    value={searchDraft}
                    onChangeText={setSearchDraft}
                    color="$primary800"
                    placeholderTextColor="$textLight500"
                  />
                </Input>

                <Pressable
                  onPress={() => router.push("/(app)/library-filters" as never)}
                  accessibilityLabel="Abrir filtros de biblioteca"
                  accessibilityRole="button"
                >
                  <Box
                    w={isWeb ? 44 : 38}
                    h={isWeb ? 44 : 38}
                    borderRadius="$full"
                    borderWidth={1}
                    borderColor={filtered ? "$primary500" : "$primary400"}
                    bg={filtered ? "$primary500" : "transparent"}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons
                      name="options-outline"
                      size={isWeb ? 22 : 18}
                      color={filtered ? "#FFFCF5" : "#A87D42"}
                    />
                  </Box>
                </Pressable>
              </HStack>

              <ActiveFilterChips chips={activeFilterChips} />

              <AppButton
                label="Añadir libro"
                onPress={() => router.push("/(app)/books/new" as never)}
                alignSelf={isWeb ? "flex-start" : "stretch"}
              />

              <Heading size="lg" color="$primary800">
                Tus libros
              </Heading>
            </VStack>
          </Box>
        }
        numColumns={gridColumns}
        key={`library-grid-${gridColumns}`}
        columnWrapperStyle={styles.gridColumn}
        renderItem={({ item, index }: { item: Book; index: number }) =>
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
          <Box px="$4">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </Box>
        }
        onEndReached={loadMoreBooks}
        onEndReachedThreshold={0.35}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={
          booksFeed.isFetchingNextPage ? (
            <Box py="$5" alignItems="center">
              <ActivityIndicator color="#A87D42" />
            </Box>
          ) : (
            <Box h={8} />
          )
        }
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.listContentWeb,
          { paddingBottom: 24 + insets.bottom },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  listContentWeb: {
    paddingHorizontal: 18,
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
});
