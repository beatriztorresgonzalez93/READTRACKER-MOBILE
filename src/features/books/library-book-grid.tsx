// Grid de libros en biblioteca (tarjetas + lista).
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { forwardRef, type ReactElement, type Ref } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutLeft } from "react-native-reanimated";

import type { Book } from "@/shared/types/books";
import { AppLink } from "@/shared/ui/app-link";
import { BookCover } from "@/shared/ui/book-cover";
import { EmptyState } from "@/shared/ui/empty-state";

const isWeb = Platform.OS === "web";
const GRID_COVER_WIDTH = 168;

export function getLibraryGridColumns(width: number): number {
  if (!isWeb) return 2;
  if (width >= 1500) return 5;
  if (width >= 1220) return 4;
  if (width >= 980) return 3;
  return 2;
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

function renderBookGridItem({ item, index }: ListRenderItemInfo<Book>) {
  if (isWeb) {
    return (
      <View style={styles.gridItemWrap}>
        <BookGridCard book={item} />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 20).duration(220)}
      exiting={FadeOutLeft.duration(180)}
      style={styles.gridItemWrap}
    >
      <BookGridCard book={item} />
    </Animated.View>
  );
}

type BookGridProps = {
  books: Book[];
  gridColumns: number;
  bottomInset: number;
  refreshing: boolean;
  onRefresh: () => void;
  isFetchingNextPage: boolean;
  onEndReached: () => void;
  onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: { itemVisiblePercentThreshold: number };
  onScroll: (offsetY: number) => void;
  ListHeaderComponent: ReactElement | null;
  emptyTitle: string;
  emptyDescription: string;
};

export const BookGrid = forwardRef(function BookGrid(
  {
    books,
    gridColumns,
    bottomInset,
    refreshing,
    onRefresh,
    isFetchingNextPage,
    onEndReached,
    onViewableItemsChanged,
    viewabilityConfig,
    onScroll,
    ListHeaderComponent,
    emptyTitle,
    emptyDescription,
  }: BookGridProps,
  ref: Ref<FlatList<Book>>,
) {
  return (
    <FlatList
      ref={ref}
      data={books}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      onScroll={(event) => onScroll(event.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior={isWeb ? "never" : "automatic"}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#A87D42"
          colors={["#A87D42"]}
        />
      }
      ListHeaderComponent={ListHeaderComponent}
      numColumns={gridColumns}
      key={`library-grid-${gridColumns}`}
      columnWrapperStyle={styles.gridColumn}
      renderItem={renderBookGridItem}
      ListEmptyComponent={
        <Box px="$4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </Box>
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.35}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListFooterComponent={
        isFetchingNextPage ? (
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
        { paddingBottom: 24 + bottomInset },
      ]}
    />
  );
});

type LibraryScrollToTopFabProps = {
  visible: boolean;
  bottom: number;
  onPress: () => void;
};

export function LibraryScrollToTopFab({ visible, bottom, onPress }: LibraryScrollToTopFabProps) {
  if (isWeb || !visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={[styles.scrollTopFab, { bottom }]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Volver arriba"
        style={styles.scrollTopPressable}
      >
        <Ionicons name="chevron-up" size={20} color="#7A6555" />
      </Pressable>
    </Animated.View>
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
  scrollTopFab: {
    position: "absolute",
    right: 16,
    zIndex: 20,
  },
  scrollTopPressable: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 252, 245, 0.94)",
    borderWidth: 1,
    borderColor: "#E5D9C2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D1F15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
