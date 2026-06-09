// Carrusel de últimas adquisiciones en wishlist.
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, ScrollView, Text, VStack } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useMemo } from "react";

import { usePurchases } from "@/features/wishlist/use-wishlist";
import type { PurchaseItem } from "@/shared/types/wishlist";

export function WishlistRecentPurchases() {
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
