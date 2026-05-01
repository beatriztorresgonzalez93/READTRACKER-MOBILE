// Gestiona la wishlist: crear, editar, comprar y eliminar deseos.
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Searchbar, Text } from "react-native-paper";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

import {
  useCreatePurchase,
  useCreateWishlistItem,
  useDeleteWishlistItem,
  useUpdateWishlistItem,
  useWishlistItems,
} from "@/features/wishlist/use-wishlist";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

const PRIORITY_OPTIONS = [
  { value: "1", label: "Alta" },
  { value: "3", label: "Media" },
  { value: "5", label: "Baja" },
];

export default function WishlistScreen() {
  const isWeb = Platform.OS === "web";
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;
  const itemsQuery = useWishlistItems();
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
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"priority" | "title" | "recent">("priority");
  const [formOpen, setFormOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"purchase" | "delete" | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);

  function normalizePriority(value: number | string): "1" | "3" | "5" {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "3";
    if (parsed <= 2) return "1";
    if (parsed >= 4) return "5";
    return "3";
  }

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
      setFormOpen(false);
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
    setFormOpen(true);
    setEditingId(item.id);
    setTitle(item.title);
    setAuthor(item.author);
    setPrice(item.price);
    setStore(item.store);
    setPriority(normalizePriority(item.priority));
  }

  async function onMarkAsPurchased(item: { id: string }) {
    try {
      await createPurchase.mutateAsync(item.id);
    } catch (error) {
      Alert.alert("No se pudo registrar compra", (error as Error).message);
    }
  }

  function onConfirmPurchase(item: { id: string; title: string }) {
    setSelectedItem(item);
    setConfirmType("purchase");
    setConfirmModalOpen(true);
  }

  function onConfirmDelete(item: { id: string; title: string }) {
    setSelectedItem(item);
    setConfirmType("delete");
    setConfirmModalOpen(true);
  }

  function closeConfirmModal() {
    setConfirmModalOpen(false);
    setConfirmType(null);
    setSelectedItem(null);
  }

  async function onAcceptConfirm() {
    if (!selectedItem || !confirmType) return;
    if (confirmType === "purchase") {
      await onMarkAsPurchased(selectedItem);
      closeConfirmModal();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    removeItem.mutate(selectedItem.id, {
      onSettled: () => closeConfirmModal(),
    });
  }

  function onOpenNewForm() {
    setFormOpen(true);
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setPrice("");
    setStore("");
    setPriority("3");
  }

  const allItems = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const uniqueStores = useMemo(() => {
    const stores = new Set<string>();
    for (const item of allItems) {
      const s = item.store?.trim();
      if (s) stores.add(s);
    }
    return [...stores].sort((a, b) => a.localeCompare(b, "es"));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allItems.filter((item) => {
      const matchesStore = storeFilter === "all" || item.store === storeFilter;
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
  }, [allItems, search, storeFilter, sortBy]);

  const storeFilterLabel = storeFilter === "all" ? "Todas las tiendas" : storeFilter;
  const sortLabel =
    sortBy === "priority" ? "Ordenar: Prioridad" : sortBy === "title" ? "Ordenar: Título" : "Ordenar: Recientes";
  const selectedPriorityLabel = PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? "Media";

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
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <ListComponent
        data={filteredItems}
        keyExtractor={(item: { id: string }) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.controlsBlock}>
              <Searchbar
                placeholder="Buscar en lista de deseos..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                placeholderTextColor={theme.colors.textSoft}
                iconColor={theme.colors.textSoft}
                elevation={0}
              />
              {isWeb ? (
                <View style={styles.controlsRow}>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setStoreModalOpen(true)}
                    style={styles.controlBtn}
                    labelStyle={styles.controlBtnLabel}
                  >
                    {storeFilterLabel}
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setSortModalOpen(true)}
                    style={styles.controlBtn}
                    labelStyle={styles.controlBtnLabel}
                  >
                    {sortLabel}
                  </Button>
                  <Button
                    mode="contained"
                    style={[styles.controlBtn, styles.addWishBtnInline]}
                    labelStyle={styles.addWishBtnLabel}
                    onPress={onOpenNewForm}
                    icon="plus"
                  >
                    Añadir deseo
                  </Button>
                </View>
              ) : (
                <>
                  <View style={styles.controlsRow}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setStoreModalOpen(true)}
                      style={styles.controlBtn}
                      labelStyle={styles.controlBtnLabel}
                    >
                      {storeFilterLabel}
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setSortModalOpen(true)}
                      style={styles.controlBtn}
                      labelStyle={styles.controlBtnLabel}
                    >
                      {sortLabel}
                    </Button>
                  </View>
                  <Button
                    mode="contained"
                    style={styles.addWishBtn}
                    labelStyle={styles.addWishBtnLabel}
                    onPress={onOpenNewForm}
                    icon="plus"
                  >
                    Añadir deseo
                  </Button>
                </>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Wishlist vacia" description="Anade tus proximas lecturas aqui." />}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(240)}
            exiting={FadeOutLeft.duration(180)}
          >
            <Card mode="contained" style={styles.itemCard}>
              <Card.Content>
                <View style={styles.itemTop}>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>
                      {item.priority <= 2 ? "ALTA" : item.priority === 3 ? "MEDIA" : "BAJA"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>{item.author ?? "Autor no definido"}</Text>
                <View style={styles.itemDivider} />
                <View style={styles.storePriceRow}>
                  <Text style={styles.itemStore} numberOfLines={1}>
                    {item.store || "Sin tienda"}
                  </Text>
                  <Text style={styles.itemPrice}>{item.price || "-"}</Text>
                </View>
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.miniIconBtn, styles.miniIconBtnPrimary]}
                    onPress={() => onConfirmPurchase(item)}
                    disabled={createPurchase.isPending}
                    accessibilityLabel="Marcar como comprado"
                  >
                    <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
                  </Pressable>
                  <Pressable
                    style={styles.miniIconBtn}
                    onPress={() => onStartEdit(item)}
                    disabled={createItem.isPending || updateItem.isPending}
                    accessibilityLabel="Editar deseo"
                  >
                    <Ionicons name="pencil-outline" size={15} color={theme.colors.textSoft} />
                  </Pressable>
                  <Pressable
                    style={styles.miniIconBtn}
                    onPress={() => onConfirmDelete(item)}
                    disabled={removeItem.isPending}
                    accessibilityLabel="Eliminar deseo"
                  >
                    <Ionicons name="trash-outline" size={15} color={theme.colors.textSoft} />
                  </Pressable>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingId ? "Editar deseo" : "Añadir deseo"}</Text>
              <Pressable onPress={() => setFormOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <AppInput label="Título" value={title} onChangeText={setTitle} placeholder="Título" />
              <AppInput label="Autor" value={author} onChangeText={setAuthor} placeholder="Autor" />
              <AppInput label="Precio" value={price} onChangeText={setPrice} placeholder="ej: 19,90 EUR" keyboardType="decimal-pad" />
              <AppInput label="Tienda" value={store} onChangeText={setStore} placeholder="ej: Casa del Libro, Amazon..." />
              <Button
                mode="outlined"
                onPress={() => setPriorityModalOpen(true)}
                style={styles.priorityPickerBtn}
                labelStyle={styles.priorityPickerLabel}
                icon="chevron-down"
                contentStyle={styles.priorityPickerContent}
              >
                Prioridad {selectedPriorityLabel}
              </Button>

              <View style={styles.modalActionsRow}>
                <Button mode="text" onPress={() => setFormOpen(false)} textColor={theme.colors.textSoft}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={onAddItem}
                  style={styles.modalSaveBtn}
                  disabled={createItem.isPending || updateItem.isPending}
                  icon="content-save-outline"
                >
                  {createItem.isPending || updateItem.isPending ? "Guardando..." : "Guardar deseo"}
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={storeModalOpen} transparent animationType="fade" onRequestClose={() => setStoreModalOpen(false)}>
        <View style={styles.selectorBackdrop}>
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Filtrar por tienda</Text>
            <Button mode={storeFilter === "all" ? "contained" : "outlined"} style={styles.selectorBtn} onPress={() => { setStoreFilter("all"); setStoreModalOpen(false); }}>
              Todas las tiendas
            </Button>
            {uniqueStores.map((s) => (
              <Button key={s} mode={storeFilter === s ? "contained" : "outlined"} style={styles.selectorBtn} onPress={() => { setStoreFilter(s); setStoreModalOpen(false); }}>
                {s}
              </Button>
            ))}
            <Button mode="text" onPress={() => setStoreModalOpen(false)} textColor={theme.colors.textSoft}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={sortModalOpen} transparent animationType="fade" onRequestClose={() => setSortModalOpen(false)}>
        <View style={styles.selectorBackdrop}>
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Ordenar</Text>
            <Button mode={sortBy === "priority" ? "contained" : "outlined"} style={styles.selectorBtn} onPress={() => { setSortBy("priority"); setSortModalOpen(false); }}>
              Prioridad
            </Button>
            <Button mode={sortBy === "title" ? "contained" : "outlined"} style={styles.selectorBtn} onPress={() => { setSortBy("title"); setSortModalOpen(false); }}>
              Título
            </Button>
            <Button mode={sortBy === "recent" ? "contained" : "outlined"} style={styles.selectorBtn} onPress={() => { setSortBy("recent"); setSortModalOpen(false); }}>
              Mas recientes
            </Button>
            <Button mode="text" onPress={() => setSortModalOpen(false)} textColor={theme.colors.textSoft}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={priorityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPriorityModalOpen(false)}
      >
        <View style={styles.selectorBackdrop}>
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Selecciona prioridad</Text>
            {PRIORITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                mode={priority === opt.value ? "contained" : "outlined"}
                style={styles.selectorBtn}
                onPress={() => {
                  setPriority(opt.value);
                  setPriorityModalOpen(false);
                }}
              >
                {opt.label}
              </Button>
            ))}
            <Button mode="text" onPress={() => setPriorityModalOpen(false)} textColor={theme.colors.textSoft}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {confirmType === "purchase" ? "Marcar como comprado" : "Eliminar deseo"}
            </Text>
            <Text style={styles.confirmBody}>
              {confirmType === "purchase"
                ? `¿Quieres marcar "${selectedItem?.title ?? ""}" como comprado?`
                : `¿Seguro que quieres eliminar "${selectedItem?.title ?? ""}" de tu wishlist?`}
            </Text>
            <View style={styles.confirmActionsRow}>
              <Button mode="outlined" onPress={closeConfirmModal} style={styles.confirmCancelBtn}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={() => void onAcceptConfirm()}
                style={styles.confirmAcceptBtn}
                buttonColor={confirmType === "delete" ? "#7D3A35" : theme.colors.primary}
                textColor={confirmType === "delete" ? theme.colors.textOnDark : theme.colors.onPrimary}
                disabled={createPurchase.isPending || removeItem.isPending}
              >
                {confirmType === "delete" ? "Eliminar" : "Confirmar"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 10,
  },
  headerContainer: {
    marginBottom: 10,
    gap: 10,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  controlsBlock: {
    gap: 10,
  },
  searchBar: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
  },
  searchInput: {
    color: theme.colors.textSoft,
    fontSize: 14,
    fontFamily: "Fraunces_400Regular",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgPanel,
  },
  controlBtnLabel: {
    color: theme.colors.textOnDark,
    fontSize: 12,
  },
  addWishBtn: {
    borderRadius: 14,
    backgroundColor: "#8C6239",
  },
  addWishBtnInline: {
    flex: 1,
  },
  addWishBtnLabel: {
    color: theme.colors.textOnDark,
  },
  formContent: {
    gap: 10,
  },
  formTitle: {
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: theme.colors.text,
    fontSize: 34,
  },
  itemCard: {
    borderRadius: theme.radius.md,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: theme.colors.card,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#7A5C47",
  },
  priorityBadgeText: {
    color: theme.colors.card,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 0.8,
  },
  itemTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
    lineHeight: 22,
    color: theme.colors.text,
  },
  itemMeta: {
    color: theme.colors.textSoft,
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  itemDivider: {
    marginTop: 6,
    marginBottom: 6,
    height: 1,
    backgroundColor: theme.colors.borderOnCard,
  },
  storePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemStore: {
    color: theme.colors.textSoft,
    fontFamily: "Fraunces_400Regular",
    fontSize: 12,
    flex: 1,
    marginRight: 6,
  },
  itemPrice: {
    color: theme.colors.text,
    fontWeight: "700",
    fontFamily: "Fraunces_700Bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    justifyContent: "flex-start",
  },
  miniIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardElevated,
  },
  miniIconBtnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  formModalCard: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    maxHeight: "84%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BE9A6A",
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priorityPickerBtn: {
    borderRadius: 14,
    borderColor: theme.colors.border,
    backgroundColor: "#8C6239",
  },
  priorityPickerLabel: {
    color: theme.colors.textOnDark,
    fontWeight: "700",
  },
  priorityPickerContent: {
    flexDirection: "row-reverse",
  },
  modalActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalSaveBtn: {
    borderRadius: 12,
    backgroundColor: "#8C6239",
  },
  selectorBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  selectorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
    padding: 14,
    gap: 8,
  },
  selectorTitle: {
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectorBtn: {
    borderRadius: 10,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
    padding: 14,
    gap: 8,
  },
  confirmTitle: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
    fontSize: 24,
  },
  confirmBody: {
    color: theme.colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  confirmActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: theme.colors.border,
  },
  confirmAcceptBtn: {
    flex: 1,
    borderRadius: 12,
  },
});

