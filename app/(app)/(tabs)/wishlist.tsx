// Wishlist: listado, filtros y acciones (gluestack-ui).
import { Box } from "@gluestack-ui/themed";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Platform } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { WishlistHeader } from "@/features/wishlist/wishlist-header";
import { WishlistItemCard } from "@/features/wishlist/wishlist-item-card";
import { useDeleteWishlistItem, useWishlistItems } from "@/features/wishlist/use-wishlist";
import { type ActiveFilterChip } from "@/shared/ui/active-filter-chips";
import type { WishlistItem } from "@/shared/types/wishlist";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { useWishlistPreferencesStore } from "@store/wishlist-preferences";

const isWeb = Platform.OS === "web";

export default function WishlistScreen() {
  const ListComponent: typeof FlatList | typeof FlashList =
    Platform.OS === "web" || Constants.appOwnership === "expo" ? FlatList : FlashList;
  const itemsQuery = useWishlistItems();
  const removeItem = useDeleteWishlistItem();
  const [search, setSearch] = useState("");
  const storeFilter = useWishlistPreferencesStore((s) => s.storeFilter);
  const setStoreFilter = useWishlistPreferencesStore((s) => s.setStoreFilter);
  const sortBy = useWishlistPreferencesStore((s) => s.sortBy);
  const setSortBy = useWishlistPreferencesStore((s) => s.setSortBy);

  const wishlistFiltersActive = storeFilter !== "all" || sortBy !== "priority";

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (storeFilter !== "all") {
      chips.push({
        id: "store",
        label: storeFilter,
        onRemove: () => setStoreFilter("all"),
      });
    }
    if (sortBy !== "priority") {
      const sortLabel =
        sortBy === "title" ? "Título (A-Z)" : sortBy === "recent" ? "Más recientes" : "Prioridad";
      chips.push({
        id: "sort",
        label: sortLabel,
        onRemove: () => setSortBy("priority"),
      });
    }
    return chips;
  }, [setSortBy, setStoreFilter, sortBy, storeFilter]);

  function onStartEdit(item: { id: string }) {
    router.push({
      pathname: "/(app)/wishlist/item-form",
      params: { editId: item.id },
    } as never);
  }

  function onConfirmPurchase(item: { id: string; title: string }) {
    router.push({
      pathname: "/(app)/wishlist/confirm",
      params: { type: "purchase", itemId: item.id, title: item.title },
    } as never);
  }

  function onConfirmDelete(item: { id: string; title: string }) {
    router.push({
      pathname: "/(app)/wishlist/confirm",
      params: { type: "delete", itemId: item.id, title: item.title },
    } as never);
  }

  const filteredItems = useMemo(() => {
    const allItems = itemsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    const list = allItems.filter((item) => {
      const itemStore = item.store?.trim() || "Sin tienda";
      const matchesStore = storeFilter === "all" || itemStore === storeFilter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.store.toLowerCase().includes(q);
      return matchesStore && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortBy === "priority") return a.priority - b.priority;
      if (sortBy === "title") return a.title.localeCompare(b.title, "es");
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    return list;
  }, [itemsQuery.data, search, storeFilter, sortBy]);

  if (itemsQuery.isLoading && !itemsQuery.data) {
    return <AppLoader />;
  }

  if (itemsQuery.isError) {
    return (
      <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
        <EmptyState
          title="No se pudo cargar la wishlist"
          description="Recarga la app y revisa la conexion."
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{ paddingTop: isWeb ? 10 : 12 }}
    >
      <ListComponent
        data={filteredItems}
        keyExtractor={(item: WishlistItem) => item.id}
        ListHeaderComponent={
          <WishlistHeader
            search={search}
            onSearchChange={setSearch}
            wishlistFiltersActive={wishlistFiltersActive}
            activeFilterChips={activeFilterChips}
            showHeading={filteredItems.length > 0}
          />
        }
        ListEmptyComponent={
          <Box px="$4">
            <EmptyState
              title="Wishlist vacía"
              description="Añade tus próximas lecturas con el botón de arriba."
            />
          </Box>
        }
        renderItem={({ item, index }: { item: WishlistItem; index: number }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(240)}
            exiting={FadeOutLeft.duration(180)}
            style={{ paddingHorizontal: isWeb ? 4 : 12, marginBottom: isWeb ? 8 : 14 }}
          >
            <WishlistItemCard
              item={item}
              onPurchase={() => onConfirmPurchase(item)}
              onEdit={() => onStartEdit(item)}
              onDelete={() => onConfirmDelete(item)}
              deleteDisabled={removeItem.isPending}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <Box h={isWeb ? 4 : 0} />}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
