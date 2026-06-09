// Biblioteca: búsqueda, filtros y grid de libros (gluestack-ui).
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWindowDimensions, type ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LIBRARY_SHELF_LABELS,
  LIBRARY_SORT_LABELS,
  LIBRARY_STATUS_LABELS,
} from "@/features/books/library-filter-labels";
import {
  BookGrid,
  getLibraryGridColumns,
  LibraryScrollToTopFab,
} from "@/features/books/library-book-grid";
import { LibraryHeader } from "@/features/books/library-header";
import {
  getLibraryPrefetchThresholdIndex,
  useBooksFeed,
} from "@/features/books/use-books";
import { useLibraryScroll } from "@/features/books/use-library-scroll";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { LibraryBooksQuery } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { type ActiveFilterChip } from "@/shared/ui/active-filter-chips";
import { Screen } from "@/shared/ui/screen";
import { useLibraryPreferencesStore } from "@store/library-preferences";

function isFilteredQuery(q: LibraryBooksQuery): boolean {
  return (
    q.search.trim() !== "" ||
    q.status !== "todos" ||
    q.shelf !== "todos" ||
    q.genre !== null ||
    q.sort !== "recientes"
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const gridColumns = getLibraryGridColumns(width);

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
  const { listRef, showScrollTop, scrollToTop, onListScroll } = useLibraryScroll();
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
      <BookGrid
        ref={listRef}
        books={books}
        gridColumns={gridColumns}
        bottomInset={insets.bottom}
        refreshing={booksFeed.isRefetching}
        onRefresh={booksFeed.refetch}
        isFetchingNextPage={booksFeed.isFetchingNextPage}
        onEndReached={loadMoreBooks}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={onListScroll}
        ListHeaderComponent={
          <LibraryHeader
            topInset={insets.top}
            searchDraft={searchDraft}
            onSearchChange={setSearchDraft}
            filtered={filtered}
            activeFilterChips={activeFilterChips}
          />
        }
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <LibraryScrollToTopFab
        visible={showScrollTop}
        bottom={20 + insets.bottom}
        onPress={scrollToTop}
      />
    </Screen>
  );
}
