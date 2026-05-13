// Pantalla de filtros de wishlist (móvil); la web sigue usando modales en wishlist.tsx.
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

import { useWishlistItems } from "@/features/wishlist/use-wishlist";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";
import {
  type WishlistSortKey,
  useWishlistPreferencesStore,
} from "@store/wishlist-preferences";

const SORT_OPTIONS: { key: WishlistSortKey; label: string }[] = [
  { key: "priority", label: "Prioridad" },
  { key: "title", label: "Título (A-Z)" },
  { key: "recent", label: "Más recientes" },
];

export default function WishlistFiltersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const appTheme = useAppTheme();
  const itemsQuery = useWishlistItems();

  const storeFilter = useWishlistPreferencesStore((s) => s.storeFilter);
  const setStoreFilter = useWishlistPreferencesStore((s) => s.setStoreFilter);
  const sortBy = useWishlistPreferencesStore((s) => s.sortBy);
  const setSortBy = useWishlistPreferencesStore((s) => s.setSortBy);
  const clearWishlistFilters = useWishlistPreferencesStore((s) => s.clearWishlistFilters);

  const allItems = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const uniqueStores = useMemo(() => {
    const stores = new Set<string>();
    for (const item of allItems) {
      const s = item.store?.trim();
      stores.add(s || "Sin tienda");
    }
    return [...stores].sort((a, b) => a.localeCompare(b, "es"));
  }, [allItems]);

  const storeCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("__all__", allItems.length);
    for (const item of allItems) {
      const s = item.store?.trim() || "Sin tienda";
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return map;
  }, [allItems]);

  const filteredCount = useMemo(() => {
    const list = allItems.filter((item) => {
      const matchesStore = storeFilter === "all" || item.store === storeFilter;
      return matchesStore;
    });
    let sorted = [...list];
    if (sortBy === "priority") sorted.sort((a, b) => a.priority - b.priority);
    else if (sortBy === "title") sorted.sort((a, b) => a.title.localeCompare(b.title, "es"));
    else sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return sorted.length;
  }, [allItems, storeFilter, sortBy]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => clearWishlistFilters()}
          hitSlop={12}
          style={{ paddingRight: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar filtros"
        >
          <Text style={styles.headerReset}>REINICIAR</Text>
        </Pressable>
      ),
    });
  }, [navigation, clearWishlistFilters]);

  const s = styles;

  return (
    <View style={[s.root, { backgroundColor: appTheme.colors.bgSoft }]}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionHeading, { color: appTheme.colors.text }]}>Tienda</Text>
        <Pressable
          onPress={() => setStoreFilter("all")}
          style={[
            s.optionCard,
            {
              borderColor: appTheme.colors.borderOnCard,
              backgroundColor: appTheme.colors.card,
            },
          ]}
        >
          <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>Todas las tiendas</Text>
          <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
            {storeCounts.get("__all__") ?? 0}
          </Text>
          {storeFilter === "all" ? (
            <Ionicons name="checkmark-circle" size={22} color={appTheme.colors.primary} />
          ) : null}
        </Pressable>
        {uniqueStores.map((storeName) => {
          const active = storeFilter === storeName;
          return (
            <Pressable
              key={storeName}
              onPress={() => setStoreFilter(storeName)}
              style={[
                s.optionCard,
                {
                  borderColor: appTheme.colors.borderOnCard,
                  backgroundColor: appTheme.colors.card,
                },
              ]}
            >
              <Text style={[s.optionLabel, { color: appTheme.colors.text }]} numberOfLines={2}>
                {storeName}
              </Text>
              <Text style={[s.optionCount, { color: appTheme.colors.textSoft }]}>
                {storeCounts.get(storeName) ?? 0}
              </Text>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={appTheme.colors.primary} />
              ) : null}
            </Pressable>
          );
        })}

        <Text style={[s.sectionHeading, s.sectionSpacer, { color: appTheme.colors.text }]}>
          Ordenar por
        </Text>
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setSortBy(opt.key)}
              style={[
                s.optionCard,
                {
                  borderColor: appTheme.colors.borderOnCard,
                  backgroundColor: appTheme.colors.card,
                },
              ]}
            >
              <Text style={[s.optionLabel, { color: appTheme.colors.text }]}>{opt.label}</Text>
              {active ? (
                <Ionicons name="radio-button-on" size={22} color={appTheme.colors.primary} />
              ) : (
                <Ionicons name="radio-button-off" size={22} color={appTheme.colors.textMutedOnDark} />
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
        >
          {itemsQuery.isLoading ? (
            <ActivityIndicator color={appTheme.colors.onPrimary} />
          ) : (
            <Text style={[s.ctaText, { color: appTheme.colors.onPrimary }]}>
              Ver {filteredCount} deseo{filteredCount === 1 ? "" : "s"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeading: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    marginBottom: 10,
  },
  sectionSpacer: { marginTop: 22 },
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
  optionLabel: { flex: 1, fontFamily: "Fraunces_400Regular", fontSize: 16 },
  optionCount: {
    fontSize: 15,
    fontFamily: "Fraunces_700Bold",
    minWidth: 28,
    textAlign: "right",
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
  ctaText: { fontFamily: "Fraunces_700Bold", fontSize: 16 },
});
