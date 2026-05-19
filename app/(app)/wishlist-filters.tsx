// Filtros de wishlist (gluestack-ui).
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

import { useWishlistItems } from "@/features/wishlist/use-wishlist";
import { AppButton } from "@/shared/ui/app-button";
import { Screen } from "@/shared/ui/screen";
import {
  type WishlistSortKey,
  useWishlistPreferencesStore,
} from "@store/wishlist-preferences";

const SORT_OPTIONS: { key: WishlistSortKey; label: string }[] = [
  { key: "priority", label: "Prioridad" },
  { key: "title", label: "Título (A-Z)" },
  { key: "recent", label: "Más recientes" },
];

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
        <Text flex={1} size="md" color="$primary800" numberOfLines={2}>
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

export default function WishlistFiltersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
          onPress={() => clearWishlistFilters()}
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
  }, [navigation, clearWishlistFilters]);

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
            Tienda
          </Text>
          <FilterOption
            label="Todas las tiendas"
            count={storeCounts.get("__all__") ?? 0}
            active={storeFilter === "all"}
            onPress={() => setStoreFilter("all")}
          />
          {uniqueStores.map((storeName) => (
            <FilterOption
              key={storeName}
              label={storeName}
              count={storeCounts.get(storeName) ?? 0}
              active={storeFilter === storeName}
              onPress={() => setStoreFilter(storeName)}
            />
          ))}

          <Text size="md" fontWeight="$bold" color="$primary800" mt="$4">
            Ordenar por
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.key}
              label={opt.label}
              active={sortBy === opt.key}
              onPress={() => setSortBy(opt.key)}
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
        {itemsQuery.isLoading ? (
          <Box py="$4" alignItems="center">
            <ActivityIndicator color="#A87D42" />
          </Box>
        ) : (
          <AppButton
            label={`Ver ${filteredCount} deseo${filteredCount === 1 ? "" : "s"}`}
            onPress={() => router.back()}
          />
        )}
      </Box>
    </Screen>
  );
}
