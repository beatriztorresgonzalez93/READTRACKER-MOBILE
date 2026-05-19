// Filtros de biblioteca (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  HStack,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBooksFeed, useBooksSummary } from "@/features/books/use-books";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { BooksSortKey, LibraryShelfFilter, LibraryStatusFilter } from "@/shared/types/books";
import { AppButton } from "@/shared/ui/app-button";
import { Screen } from "@/shared/ui/screen";
import { useLibraryPreferencesStore } from "@store/library-preferences";

const SORT_LABELS: Record<BooksSortKey, string> = {
  recientes: "Más recientes",
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
  { key: "leido", label: "Leídos" },
];

const SHELF_OPTIONS: { key: LibraryShelfFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "favoritos", label: "Favoritos" },
];

function statusCount(
  summary:
    | { total: number; pendiente: number; leyendo: number; leido: number }
    | undefined,
  key: LibraryStatusFilter,
): number {
  if (!summary) return 0;
  if (key === "todos") return summary.total;
  return summary[key];
}

function shelfCount(
  summary: { total: number; favoritos: number } | undefined,
  key: LibraryShelfFilter,
): number {
  if (!summary) return 0;
  if (key === "todos") return summary.total;
  if (key === "favoritos") return summary.favoritos;
  return 0;
}

function FilterOption({
  label,
  count,
  active,
  onPress,
  sortMode,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  sortMode?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <HStack
        alignItems="center"
        borderRadius="$lg"
        borderWidth={1}
        borderColor="$primary200"
        bg="$white"
        py="$3"
        px="$4"
        mb="$2"
        gap="$2"
      >
        <Text flex={1} size="md" color="$primary800">
          {label}
        </Text>
        {count != null ? (
          <Text size="sm" fontWeight="$bold" color="$textLight500" minWidth={28} textAlign="right">
            {count}
          </Text>
        ) : null}
        {sortMode ? (
          <Ionicons
            name={active ? "radio-button-on" : "radio-button-off"}
            size={22}
            color={active ? "#A87D42" : "#7A6555"}
          />
        ) : active ? (
          <Ionicons name="checkmark-circle" size={22} color="#A87D42" />
        ) : null}
      </HStack>
    </Pressable>
  );
}

export default function LibraryFiltersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const searchDraft = useLibraryPreferencesStore((s) => s.searchDraft);
  const status = useLibraryPreferencesStore((s) => s.status);
  const setStatus = useLibraryPreferencesStore((s) => s.setStatus);
  const shelf = useLibraryPreferencesStore((s) => s.shelf);
  const setShelf = useLibraryPreferencesStore((s) => s.setShelf);
  const genre = useLibraryPreferencesStore((s) => s.genre);
  const setGenre = useLibraryPreferencesStore((s) => s.setGenre);
  const sort = useLibraryPreferencesStore((s) => s.sort);
  const setSort = useLibraryPreferencesStore((s) => s.setSort);
  const clearFilters = useLibraryPreferencesStore((s) => s.clearFilters);

  const debouncedSearch = useDebouncedValue(searchDraft, 400);
  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      status,
      shelf,
      genre,
      sort,
    }),
    [debouncedSearch, status, shelf, genre, sort],
  );

  const summary = useBooksSummary();
  const booksFeed = useBooksFeed(listQuery);
  const totalResults = booksFeed.data?.pages[0]?.total ?? 0;
  const isLoadingCount = booksFeed.isLoading || booksFeed.isFetching;

  const genreRows = (summary.data?.genres ?? []).filter(
    (row): row is { genre: string; count: number } =>
      typeof row.genre === "string" && typeof row.count === "number",
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Filtrar",
      headerStyle: { backgroundColor: "#F6F1E7" },
      headerTintColor: "#A87D42",
      headerTitleStyle: {
        fontFamily: "Fraunces_700Bold",
        fontSize: 20,
        color: "#2D1F15",
      },
      headerShadowVisible: false,
      headerRight: () => (
        <Pressable
          onPress={() => clearFilters()}
          hitSlop={12}
          pr="$4"
          accessibilityRole="button"
          accessibilityLabel="Reiniciar filtros"
        >
          <Text size="xs" fontWeight="$bold" color="$textLight500" letterSpacing={0.6}>
            REINICIAR
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, clearFilters]);

  return (
    <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7" style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          <Text size="md" fontWeight="$bold" color="$primary800">
            Estado en lista
          </Text>
          {STATUS_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.key}
              label={opt.label}
              count={statusCount(summary.data, opt.key)}
              active={status === opt.key}
              onPress={() => setStatus(opt.key)}
            />
          ))}

          <Text size="md" fontWeight="$bold" color="$primary800" mt="$4">
            Colección
          </Text>
          {SHELF_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.key}
              label={opt.label}
              count={shelfCount(summary.data, opt.key)}
              active={shelf === opt.key}
              onPress={() => setShelf(opt.key)}
            />
          ))}

          <Text size="md" fontWeight="$bold" color="$primary800" mt="$4">
            Género
          </Text>
          <FilterOption
            label="Todos los géneros"
            count={summary.data?.total ?? 0}
            active={!genre}
            onPress={() => setGenre(null)}
          />
          {genreRows.map((row) => (
            <FilterOption
              key={row.genre}
              label={row.genre}
              count={row.count}
              active={genre === row.genre}
              onPress={() => setGenre(row.genre)}
            />
          ))}

          <Text size="md" fontWeight="$bold" color="$primary800" mt="$4">
            Ordenar por
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.key}
              label={opt.label}
              active={sort === opt.key}
              onPress={() => setSort(opt.key)}
              sortMode
            />
          ))}
        </VStack>
      </ScrollView>

      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        px="$4"
        pt="$3"
        pb={Math.max(insets.bottom, 12)}
        bg="#F6F1E7"
        borderTopWidth={1}
        borderTopColor="$primary200"
      >
        {isLoadingCount ? (
          <Box py="$4" alignItems="center">
            <ActivityIndicator color="#A87D42" />
          </Box>
        ) : (
          <AppButton
            label={`Ver ${totalResults} libro${totalResults === 1 ? "" : "s"}`}
            onPress={() => router.back()}
          />
        )}
      </Box>
    </Screen>
  );
}
