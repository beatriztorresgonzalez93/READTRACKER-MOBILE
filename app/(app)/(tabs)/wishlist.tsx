// Wishlist: listado, filtros y acciones (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Platform } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { useDeleteWishlistItem, usePurchases, useWishlistItems } from "@/features/wishlist/use-wishlist";
import { ActiveFilterChips, type ActiveFilterChip } from "@/shared/ui/active-filter-chips";
import type { PurchaseItem, WishlistItem } from "@/shared/types/wishlist";
import { AppButton } from "@/shared/ui/app-button";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { useWishlistPreferencesStore } from "@store/wishlist-preferences";

const isWeb = Platform.OS === "web";

function priorityLabel(priority: number) {
  if (priority <= 2) return "ALTA";
  if (priority === 3) return "MEDIA";
  return "BAJA";
}

function WishlistRecentPurchases() {
  const purchases = usePurchases();
  const items = useMemo(() => {
    const list = [...(purchases.data ?? [])];
    list.sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt));
    return list.slice(0, 6);
  }, [purchases.data]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  if (purchases.isError) return null;
  if (purchases.isLoading && !purchases.data) return null;
  if (items.length === 0) return null;

  return (
    <VStack space="sm" mt="$2">
      <HStack justifyContent="space-between" alignItems="center">
        <Text size="md" fontWeight="$bold" color="$primary800">
          Últimas adquisiciones
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/activity" as never)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ver historial completo de compras"
        >
          <HStack alignItems="center" space="xs">
            <Text size="sm" fontWeight="$bold" color="$primary600">
              Ver todo
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#A87D42" />
          </HStack>
        </Pressable>
      </HStack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingRight: 8 }}
      >
        {items.map((item: PurchaseItem) => {
          let dateStr = "";
          try {
            dateStr = dateFmt.format(new Date(item.purchasedAt));
          } catch {
            dateStr = "";
          }
          return (
            <Box
              key={item.id}
              width={148}
              p="$3"
              borderRadius="$lg"
              bg="$white"
              borderWidth={1}
              borderColor="$primary200"
              gap={4}
            >
              <Text size="sm" fontWeight="$bold" color="$primary800" numberOfLines={2}>
                {item.title}
              </Text>
              <Text size="xs" color="$textLight500" numberOfLines={1}>
                {item.author || "Autor no definido"}
              </Text>
              <Text size="2xs" color="$textLight500" numberOfLines={1}>
                {item.store || "—"} · {item.price || "—"}
              </Text>
              <Text size="2xs" fontWeight="$bold" color="$primary600" mt="$1">
                {dateStr}
              </Text>
            </Box>
          );
        })}
      </ScrollView>
    </VStack>
  );
}

function WishlistItemCard({
  item,
  onPurchase,
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  item: WishlistItem;
  onPurchase: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
}) {
  return (
    <Box
      borderRadius="$xl"
      bg="$white"
      borderWidth={1}
      borderColor="$primary200"
      p="$4"
      gap="$2"
    >
      <Box
        alignSelf="flex-start"
        borderRadius="$full"
        bg="$primary700"
        px="$2"
        py="$0.5"
      >
        <Text size="2xs" fontWeight="$bold" color="$white" letterSpacing={0.8}>
          {priorityLabel(item.priority)}
        </Text>
      </Box>

      <Text size="lg" fontWeight="$bold" color="$primary800" numberOfLines={2}>
        {item.title}
      </Text>
      <Text size="sm" color="$textLight500">
        {item.author ?? "Autor no definido"}
      </Text>

      <HStack justifyContent="space-between" alignItems="center" mt="$1">
        <Text flex={1} size="xs" color="$textLight500" numberOfLines={1} mr="$2">
          {item.store || "Sin tienda"}
        </Text>
        <Text size="sm" fontWeight="$bold" color="$primary800">
          {item.price || "—"}
        </Text>
      </HStack>

      {isWeb ? (
        <HStack space="sm" mt="$2">
          <Pressable
            onPress={onPurchase}
            accessibilityLabel="Marcar como comprado"
            accessibilityRole="button"
          >
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              bg="$primary500"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="checkmark" size={18} color="#FFFCF5" />
            </Box>
          </Pressable>
          <Pressable onPress={onEdit} accessibilityLabel="Editar deseo" accessibilityRole="button">
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              borderWidth={1}
              borderColor="$primary200"
              bg="$primary50"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="pencil-outline" size={16} color="#7A6555" />
            </Box>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={deleteDisabled}
            accessibilityLabel="Eliminar deseo"
            accessibilityRole="button"
          >
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              borderWidth={1}
              borderColor="$primary200"
              bg="$primary50"
              alignItems="center"
              justifyContent="center"
              opacity={deleteDisabled ? 0.5 : 1}
            >
              <Ionicons name="trash-outline" size={16} color="#7A6555" />
            </Box>
          </Pressable>
        </HStack>
      ) : (
        <HStack space="sm" mt="$3" flexWrap="wrap">
          <Pressable
            flex={1}
            onPress={onPurchase}
            accessibilityLabel="Marcar como comprado"
            accessibilityRole="button"
          >
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary500"
              py="$2.5"
              px="$2"
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFCF5" />
              <Text size="xs" fontWeight="$bold" color="$white">
                Comprado
              </Text>
            </HStack>
          </Pressable>
          <Pressable flex={1} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Editar">
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary50"
              py="$2.5"
              px="$2"
            >
              <Ionicons name="create-outline" size={18} color="#2D1F15" />
              <Text size="xs" color="$primary800">
                Editar
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            flex={1}
            onPress={onDelete}
            disabled={deleteDisabled}
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
          >
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary50"
              py="$2.5"
              px="$2"
              opacity={deleteDisabled ? 0.5 : 1}
            >
              <Ionicons name="trash-outline" size={18} color="#B42318" />
              <Text size="xs" color="#B42318" fontWeight="$bold">
                Eliminar
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      )}
    </Box>
  );
}

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
          <VStack space="md" mb="$3" px={isWeb ? "$1" : "$3"}>
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
                  placeholder="Buscar en lista de deseos..."
                  value={search}
                  onChangeText={setSearch}
                  color="$primary800"
                  placeholderTextColor="$textLight500"
                  accessibilityLabel="Buscar en wishlist"
                />
              </Input>

              <Pressable
                onPress={() => router.push("/(app)/wishlist-filters" as never)}
                accessibilityLabel="Filtros y orden"
                accessibilityRole="button"
              >
                <Box
                  w={isWeb ? 44 : 38}
                  h={isWeb ? 44 : 38}
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor={wishlistFiltersActive ? "$primary500" : "$primary400"}
                  bg={wishlistFiltersActive ? "$primary500" : "transparent"}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="options-outline"
                    size={isWeb ? 22 : 18}
                    color={wishlistFiltersActive ? "#FFFCF5" : "#A87D42"}
                  />
                </Box>
              </Pressable>
            </HStack>

            <ActiveFilterChips chips={activeFilterChips} />

            <AppButton
              label="Añadir deseo"
              onPress={() => router.push("/(app)/wishlist/item-form" as never)}
              alignSelf={isWeb ? "flex-start" : "stretch"}
            />

            <WishlistRecentPurchases />

            {filteredItems.length > 0 ? (
              <Heading size="md" color="$primary800">
                Tus deseos
              </Heading>
            ) : null}
          </VStack>
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
