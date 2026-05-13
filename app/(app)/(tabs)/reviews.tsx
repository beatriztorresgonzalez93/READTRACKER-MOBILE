// Listado de libros con reseña escrita; abre el detalle para leer o editar.
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReviewsBooksFeed } from "@/features/books/use-books";
import type { Book } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

const isWeb = Platform.OS === "web";
const COVER_W = 56;
const SNIPPET_MAX = 160;

function snippet(text: string | undefined): string {
  if (!text?.trim()) return "";
  const one = text.replace(/\s+/g, " ").trim();
  return one.length <= SNIPPET_MAX ? one : `${one.slice(0, SNIPPET_MAX).trim()}…`;
}

function StarRow({ rating }: { rating?: number | null }) {
  const raw = rating != null && Number.isFinite(rating) ? rating : 0;
  const normalized = raw > 5 ? raw / 2 : raw;
  const full = Math.min(5, Math.max(0, Math.round(normalized)));
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? "star" : "star-outline"} size={13} color={theme.colors.primary} />
      ))}
    </View>
  );
}

function ReviewRow({ book }: { book: Book }) {
  const text = snippet(book.reviewText);
  return (
    <Link href={`/(app)/books/${book.id}` as never} asChild>
      <Pressable style={styles.row} accessibilityRole="button" accessibilityLabel={`Reseña: ${book.title}`}>
        <BookCover
          uri={book.coverUrl}
          width={COVER_W}
          aspectRatio={1.45}
          borderRadius={10}
          accessibilityLabel={`Portada: ${book.title}`}
        />
        <View style={styles.rowBody}>
          <Text variant="titleSmall" style={styles.rowTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <NativeText style={styles.rowAuthor} numberOfLines={1}>
            {book.author ?? "Autor desconocido"}
          </NativeText>
          {book.rating != null && Number.isFinite(book.rating) ? <StarRow rating={book.rating} /> : null}
          {text ? (
            <NativeText style={styles.snippet} numberOfLines={4}>
              {text}
            </NativeText>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSoft} style={styles.rowChevron} />
      </Pressable>
    </Link>
  );
}

export default function ReviewsTabScreen() {
  const appTheme = useAppTheme();
  const insets = useSafeAreaInsets();
  const feed = useReviewsBooksFeed();

  const books = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data?.pages]);

  if (feed.isPending && !feed.data) {
    return <AppLoader />;
  }

  if (feed.isError) {
    return (
      <Screen edges={["bottom", "left", "right"]}>
        <NativeText style={[styles.errorText, { color: appTheme.colors.text }]}>
          No se pudieron cargar las reseñas. Comprueba tu conexión y vuelve a intentarlo.
        </NativeText>
        <Button mode="contained-tonal" onPress={() => void feed.refetch()} style={{ marginTop: 16 }}>
          Reintentar
        </Button>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior={isWeb ? "never" : "automatic"}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={feed.refetch} />}
        ListHeaderComponent={
          <View>
            <View style={{ height: isWeb ? insets.top + 72 : 0 }} />
            <View style={[styles.intro, isWeb && styles.introWeb]}>
              {isWeb ? (
                <Text variant="titleMedium" style={{ color: appTheme.colors.textOnDark }}>
                  Tus reseñas
                </Text>
              ) : (
                <NativeText style={styles.introTitleMobile}>Tus reseñas</NativeText>
              )}
              {isWeb ? (
                <Text variant="bodySmall" style={{ color: appTheme.colors.textMutedOnDark, marginTop: 4 }}>
                  Libros en los que has escrito algo en el campo de reseña.
                </Text>
              ) : (
                <NativeText style={styles.introSubtitleMobile}>
                  Libros en los que has escrito algo en el campo de reseña.
                </NativeText>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => <ReviewRow book={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title="Sin reseñas por ahora"
              description="Cuando escribas una reseña en un libro, aparecerá aqui. Puedes hacerlo desde la ficha del libro."
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {feed.hasNextPage ? (
              isWeb ? (
                <Button
                  mode="contained"
                  onPress={() => void feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  style={styles.loadMore}
                >
                  {feed.isFetchingNextPage ? "Cargando..." : "Cargar mas"}
                </Button>
              ) : (
                <Pressable
                  style={[styles.loadMoreMobile, feed.isFetchingNextPage && { opacity: 0.6 }]}
                  onPress={() => void feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                >
                  <NativeText style={styles.loadMoreLabelMobile}>
                    {feed.isFetchingNextPage ? "Cargando..." : "Cargar mas"}
                  </NativeText>
                </Pressable>
              )
            ) : null}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  introWeb: {
    paddingTop: 8,
  },
  introTitleMobile: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
    color: theme.colors.text,
  },
  introSubtitleMobile: {
    marginTop: 6,
    fontSize: 14,
    color: theme.colors.textSoft,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: theme.colors.text,
  },
  rowAuthor: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.textSoft,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 6,
  },
  snippet: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    opacity: 0.92,
  },
  rowChevron: {
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: 16 + COVER_W + 12,
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  loadMore: {
    alignSelf: "center",
  },
  loadMoreMobile: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  loadMoreLabelMobile: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.onPrimary,
  },
  errorText: {
    padding: 20,
    fontSize: 15,
    lineHeight: 22,
  },
});
