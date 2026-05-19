// Historial completo de libros comprados desde la wishlist (gluestack-ui).
import { Text } from "@gluestack-ui/themed";
import Constants from "expo-constants";
import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { PurchaseListCard } from "@/features/wishlist/purchase-list-card";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { BOOK_SHEET_BG } from "@/features/books/book-sheet-ui";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";

export default function ActivityPurchasesScreen() {
  const purchases = usePurchases();
  const ListComponent: typeof FlatList | typeof FlashList =
    Constants.appOwnership === "expo" ? FlatList : FlashList;

  const sorted = useMemo(() => {
    const list = [...(purchases.data ?? [])];
    list.sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt));
    return list;
  }, [purchases.data]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  if (purchases.isLoading && !purchases.data) {
    return <AppLoader />;
  }

  if (purchases.isError) {
    return (
      <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
        <EmptyState
          title="No se pudo cargar el historial"
          description="Revisa la conexion y vuelve a intentarlo."
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor={BOOK_SHEET_BG}
      webBackgroundColor={BOOK_SHEET_BG}
      style={styles.screen}
    >
      <Text size="sm" color="$textLight700" lineHeight={20} mb="$4">
        Registro de todas las compras registradas desde tu lista de deseos.
      </Text>
      <ListComponent
        data={sorted}
        keyExtractor={(item: { id: string }) => item.id}
        ListEmptyComponent={
          <EmptyState
            title="Sin compras registradas"
            description="Cuando marques deseos como comprados apareceran aqui."
          />
        }
        renderItem={({ item, index }: { item: (typeof sorted)[number]; index: number }) => {
          let dateStr = "";
          try {
            dateStr = dateFormatter.format(new Date(item.purchasedAt));
          } catch {
            dateStr = "";
          }
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 12) * 24).duration(220)}
              exiting={FadeOutLeft.duration(160)}
            >
              <PurchaseListCard
                title={item.title}
                author={item.author}
                price={item.price}
                store={item.store}
                dateLabel={dateStr}
              />
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
});
