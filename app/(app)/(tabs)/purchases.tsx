// Lista de compras realizadas desde la wishlist del usuario.
import Constants from "expo-constants";
import { FlatList, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Card, Text } from "react-native-paper";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { usePurchases } from "@/features/wishlist/use-wishlist";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function PurchasesScreen() {
  const purchases = usePurchases();
  const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;

  if (purchases.isLoading && !purchases.data) {
    return <AppLoader />;
  }

  if (purchases.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se pudieron cargar las compras"
          description="Revisa la conexion y vuelve a intentarlo."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ListComponent
        data={purchases.data ?? []}
        keyExtractor={(item: { id: string }) => item.id}
        ListEmptyComponent={<EmptyState title="Sin compras aun" description="Cuando marques deseos como comprados apareceran aqui." />}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(240)}
            exiting={FadeOutLeft.duration(180)}
          >
            <Card mode="outlined" style={styles.purchaseCard}>
              <Card.Content>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.author || "Autor no definido"}</Text>
                <Text style={styles.meta}>{item.price || "Sin precio"}</Text>
                <Text style={styles.meta}>{item.store || "Sin tienda"}</Text>
                <Text style={styles.meta}>{dateFormatter.format(new Date(item.purchasedAt))}</Text>
              </Card.Content>
            </Card>
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  purchaseCard: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.textSoft,
  },
});

