import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import {
  useCreatePurchase,
  useCreateWishlistItem,
  useDeleteWishlistItem,
  useUpdateWishlistItem,
  useWishlistItems,
  usePurchases,
} from "@/features/wishlist/use-wishlist";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function WishlistScreen() {
  const moneyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

  const itemsQuery = useWishlistItems();
  const purchasesQuery = usePurchases();
  const createItem = useCreateWishlistItem();
  const updateItem = useUpdateWishlistItem();
  const removeItem = useDeleteWishlistItem();
  const createPurchase = useCreatePurchase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [priority, setPriority] = useState("3");

  const computedSummary = useMemo(
    () => ({
      pendingItems: itemsQuery.data?.length ?? 0,
      purchasedItems: purchasesQuery.data?.length ?? 0,
      monthlySpend:
        purchasesQuery.data?.reduce((acc, item) => {
          const parsed = Number.parseFloat((item.price ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
          return Number.isFinite(parsed) ? acc + parsed : acc;
        }, 0) ?? 0,
    }),
    [itemsQuery.data, purchasesQuery.data],
  );

  async function onAddItem() {
    if (!title.trim() || !author.trim()) {
      Alert.alert("Campos requeridos", "Debes introducir titulo y autor.");
      return;
    }
    try {
      const payload = {
        title: title.trim(),
        author: author.trim(),
        price: price.trim() || "Sin precio",
        store: store.trim() || "Sin tienda",
        priority: Math.max(1, Math.min(5, Number(priority) || 3)) as 1 | 2 | 3 | 4 | 5,
      };
      if (editingId) {
        await updateItem.mutateAsync({ itemId: editingId, payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setEditingId(null);
      setTitle("");
      setAuthor("");
      setPrice("");
      setStore("");
      setPriority("3");
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message);
    }
  }

  function onStartEdit(item: {
    id: string;
    title: string;
    author: string;
    price: string;
    store: string;
    priority: number;
  }) {
    setEditingId(item.id);
    setTitle(item.title);
    setAuthor(item.author);
    setPrice(item.price);
    setStore(item.store);
    setPriority(String(item.priority));
  }

  async function onMarkAsPurchased(item: { id: string }) {
    try {
      await createPurchase.mutateAsync(item.id);
    } catch (error) {
      Alert.alert("No se pudo registrar compra", (error as Error).message);
    }
  }

  if (itemsQuery.isLoading && !itemsQuery.data) {
    return <AppLoader />;
  }

  if (itemsQuery.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se pudo cargar la wishlist"
          description="Recarga la app y revisa la conexion."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={itemsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Card mode="outlined" style={styles.summaryCard}>
              <Card.Content>
              <Text style={styles.summaryText}>Pendientes: {computedSummary.pendingItems}</Text>
              <Text style={styles.summaryText}>Comprados: {computedSummary.purchasedItems}</Text>
              <Text style={styles.summaryText}>Gasto estimado: {moneyFormatter.format(computedSummary.monthlySpend)}</Text>
              </Card.Content>
            </Card>

            <Card mode="outlined" style={styles.formCard}>
              <Card.Content style={styles.formContent}>
              <Text style={styles.formTitle}>{editingId ? "Editar deseo" : "Anadir deseo"}</Text>
              <AppInput label="Titulo" value={title} onChangeText={setTitle} placeholder="Libro deseado" />
              <AppInput label="Autor" value={author} onChangeText={setAuthor} placeholder="Autor" />
              <AppInput label="Precio (opcional)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
              <AppInput label="Tienda (opcional)" value={store} onChangeText={setStore} placeholder="Casa del libro" />
              <AppInput
                label="Prioridad (1-5)"
                value={priority}
                onChangeText={setPriority}
                keyboardType="number-pad"
                placeholder="3"
              />
              <Button
                mode="contained"
                style={styles.primaryButton}
                onPress={onAddItem}
                disabled={createItem.isPending || updateItem.isPending}
              >
                {createItem.isPending || updateItem.isPending ? "Guardando..." : "Guardar en wishlist"}
              </Button>
              {editingId ? (
                <Button
                  mode="outlined"
                  style={styles.secondaryButton}
                  onPress={() => {
                    setEditingId(null);
                    setTitle("");
                    setAuthor("");
                    setPrice("");
                    setStore("");
                    setPriority("3");
                  }}
                >
                  Cancelar edicion
                </Button>
              ) : null}
              </Card.Content>
            </Card>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Wishlist vacia" description="Anade tus proximas lecturas aqui." />}
        renderItem={({ item }) => (
          <Card mode="outlined" style={styles.itemCard}>
            <Card.Content>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.author ?? "Autor no definido"}</Text>
            <Text style={styles.itemMeta}>Precio: {item.price || "-"}</Text>
            <Text style={styles.itemMeta}>Tienda: {item.store || "-"}</Text>
            <Text style={styles.itemMeta}>Prioridad: {item.priority}</Text>
            <View style={styles.actionsRow}>
              <Button
                mode="contained"
                style={styles.actionPrimary}
                onPress={() => onMarkAsPurchased(item)}
                disabled={createPurchase.isPending}
              >
                Comprado
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => onStartEdit(item)}
                disabled={createItem.isPending || updateItem.isPending}
              >
                Editar
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => removeItem.mutate(item.id)}
                disabled={removeItem.isPending}
              >
                Eliminar
              </Button>
            </View>
            </Card.Content>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  summaryCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgSoft,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  summaryText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  formCard: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: 10,
  },
  formContent: {
    gap: 10,
  },
  formTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  primaryButton: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
  },
  itemCard: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  itemTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  itemMeta: {
    color: theme.colors.textSoft,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionPrimary: {
    flex: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
  },
});

