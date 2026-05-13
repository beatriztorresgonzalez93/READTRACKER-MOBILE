// Historial completo de libros comprados desde la wishlist.
import Constants from "expo-constants";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Card } from "react-native-paper";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import { usePurchases } from "@/features/wishlist/use-wishlist";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function ActivityPurchasesScreen() {
  const purchases = usePurchases();
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;

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
      <Screen>
        <EmptyState
          title="No se pudo cargar el historial"
          description="Revisa la conexion y vuelve a intentarlo."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <Text style={styles.lead}>
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
        renderItem={({ item, index }: { item: any; index: number }) => {
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
              <Card mode="outlined" style={styles.card}>
                <Card.Content style={styles.cardInner}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>{item.author || "Autor no definido"}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaMuted}>{item.price || "Sin precio"}</Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.metaMuted}>{item.store || "Sin tienda"}</Text>
                  </View>
                  <Text style={styles.date}>{dateStr}</Text>
                </Card.Content>
              </Card>
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
    backgroundColor: theme.colors.bgSoft,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  lead: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSoft,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
  },
  cardInner: {
    gap: 4,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    color: theme.colors.textSoft,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  metaMuted: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    color: theme.colors.textMutedOnDark,
  },
  dot: {
    color: theme.colors.textMutedOnDark,
  },
  date: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 6,
  },
});
