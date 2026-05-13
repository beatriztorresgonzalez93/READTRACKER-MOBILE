// Pantalla dedicada de filtros de biblioteca (sobre todo móvil); la web sigue usando el panel en index.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBooksFeed, useBooksSummary } from "@/features/books/use-books";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { BooksSortKey, LibraryShelfFilter, LibraryStatusFilter } from "@/shared/types/books";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
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

export default function LibraryFiltersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const appTheme = useAppTheme();

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
      headerStyle: { backgroundColor: appTheme.colors.bgSoft },
      headerTintColor: appTheme.colors.primary,
      headerTitleStyle: {
        fontFamily: "Fraunces_700Bold",
        fontSize: 20,
        color: appTheme.colors.text,
      },
      headerShadowVisible: false,
      headerRight: () => (
        <Pressable
          onPress={() => clearFilters()}
          hitSlop={12}
          style={{ paddingRight: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar filtros"
        >
          <Text style={styles.headerReset}>REINICIAR</Text>
        </Pressable>
      ),
    });
  }, [navigation, clearFilters, appTheme.colors]);

  const s = styles;

  return (
    <View style={[s.root, { backgroundColor: appTheme.colors.bgSoft }]}>
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionHeading}>Estado en lista</Text>
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.key;
            const count = statusCount(summary.data, opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => setStatus(opt.key)}
                style={[
                  s.optionCard,
                  {
                    borderColor: appTheme.colors.borderOnCard,
                    backgroundColor: appTheme.colors.card,
                  },
                ]}
              >
                <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>
                  {opt.label}
                </Text>
                <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
                  {count}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={appTheme.colors.primary}
                    style={s.optionCheck}
                  />
                ) : null}
              </Pressable>
            );
          })}

          <Text style={[s.sectionHeading, s.sectionSpacer]}>Colección</Text>
          {SHELF_OPTIONS.map((opt) => {
            const active = shelf === opt.key;
            const count = shelfCount(summary.data, opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => setShelf(opt.key)}
                style={[
                  s.optionCard,
                  {
                    borderColor: appTheme.colors.borderOnCard,
                    backgroundColor: appTheme.colors.card,
                  },
                ]}
              >
                <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>
                  {opt.label}
                </Text>
                <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
                  {count}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={appTheme.colors.primary}
                    style={s.optionCheck}
                  />
                ) : null}
              </Pressable>
            );
          })}

          <Text style={[s.sectionHeading, s.sectionSpacer]}>Género</Text>
          <Pressable
            onPress={() => setGenre(null)}
            style={[
              s.optionCard,
              {
                borderColor: appTheme.colors.borderOnCard,
                backgroundColor: appTheme.colors.card,
              },
            ]}
          >
            <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>
              Todos los géneros
            </Text>
            <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
              {summary.data?.total ?? 0}
            </Text>
            {!genre ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={appTheme.colors.primary}
                style={s.optionCheck}
              />
            ) : null}
          </Pressable>
          {genreRows.map((row) => {
            const active = genre === row.genre;
            return (
              <Pressable
                key={row.genre}
                onPress={() => setGenre(row.genre)}
                style={[
                  s.optionCard,
                  {
                    borderColor: appTheme.colors.borderOnCard,
                    backgroundColor: appTheme.colors.card,
                  },
                ]}
              >
                <Text
                  style={[s.optionLabel, { color: appTheme.colors.text }]}
                  numberOfLines={2}
                >
                  {row.genre}
                </Text>
                <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
                  {row.count}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={appTheme.colors.primary}
                    style={s.optionCheck}
                  />
                ) : null}
              </Pressable>
            );
          })}

          <Text style={[s.sectionHeading, s.sectionSpacer]}>Ordenar por</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSort(opt.key)}
                style={[
                  s.optionCard,
                  {
                    borderColor: appTheme.colors.borderOnCard,
                    backgroundColor: appTheme.colors.card,
                  },
                ]}
              >
                <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>
                  {opt.label}
                </Text>
                {active ? (
                  <Ionicons
                    name="radio-button-on"
                    size={22}
                    color={appTheme.colors.primary}
                  />
                ) : (
                  <Ionicons
                    name="radio-button-off"
                    size={22}
                    color={appTheme.colors.textMutedOnDark}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            s.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: appTheme.colors.bgSoft,
              borderTopColor: appTheme.colors.border,
            },
          ]}
        >
          <Pressable
            style={[s.cta, { backgroundColor: appTheme.colors.primary }]}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            {isLoadingCount ? (
              <ActivityIndicator color={appTheme.colors.onPrimary} />
            ) : (
              <Text style={[s.ctaText, { color: appTheme.colors.onPrimary }]}>
                Ver {totalResults} libro{totalResults === 1 ? "" : "s"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: 10,
  },
  sectionSpacer: {
    marginTop: 22,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  optionLabel: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
  },
  optionCount: {
    fontSize: 15,
    fontFamily: "Fraunces_700Bold",
    minWidth: 28,
    textAlign: "right",
  },
  optionCheck: {
    marginLeft: 4,
  },
  headerReset: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
    letterSpacing: 0.6,
    color: theme.colors.textSoft,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  ctaText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
});
