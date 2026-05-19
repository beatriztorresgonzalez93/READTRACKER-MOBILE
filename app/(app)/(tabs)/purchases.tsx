// Lista de compras realizadas desde la wishlist del usuario (gluestack-ui).
import Constants from "expo-constants";
import { FlatList, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { PurchaseListCard } from "@/features/wishlist/purchase-list-card";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { BOOK_SHEET_BG } from "@/features/books/book-sheet-ui";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";

export default function PurchasesScreen() {
  const purchases = usePurchases();
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const ListComponent: typeof FlatList | typeof FlashList =
    Constants.appOwnership === "expo" ? FlatList : FlashList;

  if (purchases.isLoading && !purchases.data) {
    return <AppLoader />;
  }

  if (purchases.isError) {
    return (
      <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
        <EmptyState
          title="No se pudieron cargar las compras"
          description="Revisa la conexion y vuelve a intentarlo."
        />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
      <ListComponent
        data={purchases.data ?? []}
        keyExtractor={(item: { id: string }) => item.id}
        ListEmptyComponent={
          <EmptyState
            title="Sin compras aun"
            description="Cuando marques deseos como comprados apareceran aqui."
          />
        }
        renderItem={({ item, index }: { item: NonNullable<typeof purchases.data>[number]; index: number }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(240)}
            exiting={FadeOutLeft.duration(180)}
          >
            <PurchaseListCard
              title={item.title}
              author={item.author}
              price={item.price}
              store={item.store}
              dateLabel={dateFormatter.format(new Date(item.purchasedAt))}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});
