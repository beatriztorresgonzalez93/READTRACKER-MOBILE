// Gestiona la wishlist: crear, editar, comprar y eliminar deseos.
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
} from "react-native";
import { Button, Card, Searchbar, Text as PaperText } from "react-native-paper";
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
              {isWeb ? (
                <>
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
                </>
              ) : (
                <>
                  <View style={styles.mobileSearchShell}>
                    <Ionicons name="search-outline" size={20} color={theme.colors.textSoft} />
                    <TextInput
                      style={styles.mobileSearchInput}
                      placeholder="Buscar en lista de deseos..."
                      placeholderTextColor={theme.colors.textSoft}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                  <View style={styles.controlsRowMobile}>
                    <Pressable
                      style={styles.mobileOutlineBtn}
                      onPress={() => setStoreModalOpen(true)}
                    >
                      <NativeText style={styles.mobileOutlineBtnText} numberOfLines={1}>
                        {storeFilterLabel}
                      </NativeText>
                    </Pressable>
                    <Pressable
                      style={styles.mobileOutlineBtn}
                      onPress={() => setSortModalOpen(true)}
                    >
                      <NativeText style={styles.mobileOutlineBtnText} numberOfLines={1}>
                        {sortLabel}
                      </NativeText>
                    </Pressable>
                  </View>
                  <Pressable style={styles.mobilePrimaryBtn} onPress={onOpenNewForm}>
                    <Ionicons name="add" size={20} color={theme.colors.textOnDark} />
                    <NativeText style={styles.mobilePrimaryBtnText}>Añadir deseo</NativeText>
                  </Pressable>
                  <View style={styles.mobileActionHint}>
                    <Ionicons name="hand-left-outline" size={18} color={theme.colors.primary} />
                    <NativeText style={styles.mobileActionHintText}>
                      Compra, edita o elimina desde los botones de cada tarjeta.
                    </NativeText>
                  </View>
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
            {isWeb ? (
              <Card mode="contained" style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemTop}>
                    <View style={styles.priorityBadge}>
                      <PaperText style={styles.priorityBadgeText}>
                        {item.priority <= 2 ? "ALTA" : item.priority === 3 ? "MEDIA" : "BAJA"}
                      </PaperText>
                    </View>
                  </View>
                  <PaperText style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </PaperText>
                  <PaperText style={styles.itemMeta}>{item.author ?? "Autor no definido"}</PaperText>
                  <View style={styles.itemDivider} />
                  <View style={styles.storePriceRow}>
                    <PaperText style={styles.itemStore} numberOfLines={1}>
                      {item.store || "Sin tienda"}
                    </PaperText>
                    <PaperText style={styles.itemPrice}>{item.price || "-"}</PaperText>
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
            ) : (
              <View style={styles.mobileItemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.priorityBadgeMobile}>
                    <NativeText style={styles.priorityBadgeText}>
                      {item.priority <= 2 ? "ALTA" : item.priority === 3 ? "MEDIA" : "BAJA"}
                    </NativeText>
                  </View>
                </View>
                <NativeText style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </NativeText>
                <NativeText style={styles.itemMeta}>{item.author ?? "Autor no definido"}</NativeText>
                <View style={styles.itemDividerMobile} />
                <View style={styles.storePriceRow}>
                  <NativeText style={styles.itemStore} numberOfLines={1}>
                    {item.store || "Sin tienda"}
                  </NativeText>
                  <NativeText style={styles.itemPrice}>{item.price || "-"}</NativeText>
                </View>
                <View style={styles.actionsRowMobile}>
                  <Pressable
                    style={[styles.mobileActionPill, styles.mobileActionPillPrimary]}
                    onPress={() => onConfirmPurchase(item)}
                    disabled={createPurchase.isPending}
                    accessibilityLabel="Marcar como comprado"
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.onPrimary} />
                    <NativeText style={styles.mobileActionPillLabelPrimary}>Comprar</NativeText>
                  </Pressable>
                  <Pressable
                    style={styles.mobileActionPill}
                    onPress={() => onStartEdit(item)}
                    disabled={createItem.isPending || updateItem.isPending}
                    accessibilityLabel="Editar deseo"
                  >
                    <Ionicons name="create-outline" size={18} color={theme.colors.text} />
                    <NativeText style={styles.mobileActionPillLabel}>Editar</NativeText>
                  </Pressable>
                  <Pressable
                    style={[styles.mobileActionPill, styles.mobileActionPillDanger]}
                    onPress={() => onConfirmDelete(item)}
                    disabled={removeItem.isPending}
                    accessibilityLabel="Eliminar deseo"
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    <NativeText style={[styles.mobileActionPillLabel, styles.mobileActionPillLabelDanger]}>
                      Eliminar
                    </NativeText>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: isWeb ? 8 : 14 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={formOpen}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={() => setFormOpen(false)}
      >
        <View style={[styles.modalBackdrop, !isWeb && styles.modalBackdropSheet]}>
          <View style={[styles.formModalCard, !isWeb && styles.formModalSheet]}>
            <View style={styles.formHeader}>
              {isWeb ? (
                <PaperText style={styles.formTitle}>{editingId ? "Editar deseo" : "Añadir deseo"}</PaperText>
              ) : (
                <NativeText style={styles.formTitle}>{editingId ? "Editar deseo" : "Añadir deseo"}</NativeText>
              )}
              <Pressable onPress={() => setFormOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={[styles.formContent, !isWeb && styles.formContentMobile]}
              showsVerticalScrollIndicator={false}
            >
              <AppInput
                label="Título"
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                autoCapitalize="sentences"
              />
              <AppInput
                label="Autor"
                value={author}
                onChangeText={setAuthor}
                placeholder="Autor"
                autoCapitalize="words"
              />
              <AppInput
                label="Precio"
                value={price}
                onChangeText={setPrice}
                placeholder="ej: 19,90 EUR"
                autoCapitalize="none"
                keyboardType="decimal-pad"
              />
              <AppInput
                label="Tienda"
                value={store}
                onChangeText={setStore}
                placeholder="ej: Casa del Libro, Amazon..."
                autoCapitalize="sentences"
              />
              {isWeb ? (
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
              ) : (
                <Pressable
                  style={styles.mobilePriorityOpenBtn}
                  onPress={() => setPriorityModalOpen(true)}
                >
                  <NativeText style={styles.mobilePriorityOpenLabel}>Prioridad: {selectedPriorityLabel}</NativeText>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textOnDark} />
                </Pressable>
              )}

              <View style={[styles.modalActionsRow, !isWeb && styles.modalActionsRowMobile]}>
                {isWeb ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Pressable style={styles.mobileModalGhostBtn} onPress={() => setFormOpen(false)}>
                      <NativeText style={styles.mobileModalGhostBtnText}>Cancelar</NativeText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.mobileModalPrimaryBtn,
                        (createItem.isPending || updateItem.isPending) && styles.mobileModalPrimaryBtnDisabled,
                      ]}
                      onPress={onAddItem}
                      disabled={createItem.isPending || updateItem.isPending}
                    >
                      {createItem.isPending || updateItem.isPending ? (
                        <ActivityIndicator color={theme.colors.textOnDark} />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={20} color={theme.colors.textOnDark} />
                          <NativeText style={styles.mobileModalPrimaryBtnText}>Guardar deseo</NativeText>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={storeModalOpen}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={() => setStoreModalOpen(false)}
      >
        <View style={[styles.selectorBackdrop, !isWeb && styles.selectorBackdropSheet]}>
          <View style={[styles.selectorCard, !isWeb && styles.selectorSheet]}>
            {isWeb ? (
              <PaperText style={styles.selectorTitle}>Filtrar por tienda</PaperText>
            ) : (
              <NativeText style={[styles.selectorTitle, styles.selectorTitleMobile]}>Filtrar por tienda</NativeText>
            )}
            {isWeb ? (
              <>
                <Button
                  mode={storeFilter === "all" ? "contained" : "outlined"}
                  style={styles.selectorBtn}
                  onPress={() => {
                    setStoreFilter("all");
                    setStoreModalOpen(false);
                  }}
                >
                  Todas las tiendas
                </Button>
                {uniqueStores.map((s) => (
                  <Button
                    key={s}
                    mode={storeFilter === s ? "contained" : "outlined"}
                    style={styles.selectorBtn}
                    onPress={() => {
                      setStoreFilter(s);
                      setStoreModalOpen(false);
                    }}
                  >
                    {s}
                  </Button>
                ))}
                <Button mode="text" onPress={() => setStoreModalOpen(false)} textColor={theme.colors.textSoft}>
                  Cerrar
                </Button>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.mobileSheetOption, storeFilter === "all" && styles.mobileSheetOptionSelected]}
                  onPress={() => {
                    setStoreFilter("all");
                    setStoreModalOpen(false);
                  }}
                >
                  <NativeText
                    style={[
                      styles.mobileSheetOptionText,
                      storeFilter === "all" && styles.mobileSheetOptionTextSelected,
                    ]}
                  >
                    Todas las tiendas
                  </NativeText>
                </Pressable>
                {uniqueStores.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.mobileSheetOption, storeFilter === s && styles.mobileSheetOptionSelected]}
                    onPress={() => {
                      setStoreFilter(s);
                      setStoreModalOpen(false);
                    }}
                  >
                    <NativeText
                      style={[
                        styles.mobileSheetOptionText,
                        storeFilter === s && styles.mobileSheetOptionTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {s}
                    </NativeText>
                  </Pressable>
                ))}
                <Pressable style={styles.mobileSheetCloseBtn} onPress={() => setStoreModalOpen(false)}>
                  <NativeText style={styles.mobileSheetCloseBtnText}>Cerrar</NativeText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={sortModalOpen}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={() => setSortModalOpen(false)}
      >
        <View style={[styles.selectorBackdrop, !isWeb && styles.selectorBackdropSheet]}>
          <View style={[styles.selectorCard, !isWeb && styles.selectorSheet]}>
            {isWeb ? (
              <PaperText style={styles.selectorTitle}>Ordenar</PaperText>
            ) : (
              <NativeText style={[styles.selectorTitle, styles.selectorTitleMobile]}>Ordenar</NativeText>
            )}
            {isWeb ? (
              <>
                <Button
                  mode={sortBy === "priority" ? "contained" : "outlined"}
                  style={styles.selectorBtn}
                  onPress={() => {
                    setSortBy("priority");
                    setSortModalOpen(false);
                  }}
                >
                  Prioridad
                </Button>
                <Button
                  mode={sortBy === "title" ? "contained" : "outlined"}
                  style={styles.selectorBtn}
                  onPress={() => {
                    setSortBy("title");
                    setSortModalOpen(false);
                  }}
                >
                  Título
                </Button>
                <Button
                  mode={sortBy === "recent" ? "contained" : "outlined"}
                  style={styles.selectorBtn}
                  onPress={() => {
                    setSortBy("recent");
                    setSortModalOpen(false);
                  }}
                >
                  Mas recientes
                </Button>
                <Button mode="text" onPress={() => setSortModalOpen(false)} textColor={theme.colors.textSoft}>
                  Cerrar
                </Button>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.mobileSheetOption, sortBy === "priority" && styles.mobileSheetOptionSelected]}
                  onPress={() => {
                    setSortBy("priority");
                    setSortModalOpen(false);
                  }}
                >
                  <NativeText
                    style={[
                      styles.mobileSheetOptionText,
                      sortBy === "priority" && styles.mobileSheetOptionTextSelected,
                    ]}
                  >
                    Prioridad
                  </NativeText>
                </Pressable>
                <Pressable
                  style={[styles.mobileSheetOption, sortBy === "title" && styles.mobileSheetOptionSelected]}
                  onPress={() => {
                    setSortBy("title");
                    setSortModalOpen(false);
                  }}
                >
                  <NativeText
                    style={[
                      styles.mobileSheetOptionText,
                      sortBy === "title" && styles.mobileSheetOptionTextSelected,
                    ]}
                  >
                    Título
                  </NativeText>
                </Pressable>
                <Pressable
                  style={[styles.mobileSheetOption, sortBy === "recent" && styles.mobileSheetOptionSelected]}
                  onPress={() => {
                    setSortBy("recent");
                    setSortModalOpen(false);
                  }}
                >
                  <NativeText
                    style={[
                      styles.mobileSheetOptionText,
                      sortBy === "recent" && styles.mobileSheetOptionTextSelected,
                    ]}
                  >
                    Mas recientes
                  </NativeText>
                </Pressable>
                <Pressable style={styles.mobileSheetCloseBtn} onPress={() => setSortModalOpen(false)}>
                  <NativeText style={styles.mobileSheetCloseBtnText}>Cerrar</NativeText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={priorityModalOpen}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={() => setPriorityModalOpen(false)}
      >
        <View style={[styles.selectorBackdrop, !isWeb && styles.selectorBackdropSheet]}>
          <View style={[styles.selectorCard, !isWeb && styles.selectorSheet]}>
            {isWeb ? (
              <PaperText style={styles.selectorTitle}>Selecciona prioridad</PaperText>
            ) : (
              <NativeText style={[styles.selectorTitle, styles.selectorTitleMobile]}>
                Selecciona prioridad
              </NativeText>
            )}
            {isWeb ? (
              <>
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
              </>
            ) : (
              <>
                <View style={styles.mobilePriorityPillRow}>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.mobilePriorityPill, priority === opt.value && styles.mobilePriorityPillSelected]}
                      onPress={() => {
                        setPriority(opt.value);
                        setPriorityModalOpen(false);
                      }}
                    >
                      <NativeText
                        style={[
                          styles.mobilePriorityPillText,
                          priority === opt.value && styles.mobilePriorityPillTextSelected,
                        ]}
                      >
                        {opt.label}
                      </NativeText>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.mobileSheetCloseBtn} onPress={() => setPriorityModalOpen(false)}>
                  <NativeText style={styles.mobileSheetCloseBtnText}>Cerrar</NativeText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmModalOpen}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={closeConfirmModal}
      >
        <View style={[styles.modalBackdrop, !isWeb && styles.modalBackdropSheet]}>
          <View style={[styles.confirmCard, !isWeb && styles.confirmSheet]}>
            {isWeb ? (
              <>
                <PaperText style={styles.confirmTitle}>
                  {confirmType === "purchase" ? "Marcar como comprado" : "Eliminar deseo"}
                </PaperText>
                <PaperText style={styles.confirmBody}>
                  {confirmType === "purchase"
                    ? `¿Quieres marcar "${selectedItem?.title ?? ""}" como comprado?`
                    : `¿Seguro que quieres eliminar "${selectedItem?.title ?? ""}" de tu wishlist?`}
                </PaperText>
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
              </>
            ) : (
              <>
                <NativeText style={[styles.confirmTitle, styles.confirmTitleMobile]}>
                  {confirmType === "purchase" ? "Marcar como comprado" : "Eliminar deseo"}
                </NativeText>
                <NativeText style={[styles.confirmBody, styles.confirmBodyMobile]}>
                  {confirmType === "purchase"
                    ? `¿Quieres marcar "${selectedItem?.title ?? ""}" como comprado?`
                    : `¿Seguro que quieres eliminar "${selectedItem?.title ?? ""}" de tu wishlist?`}
                </NativeText>
                <View style={styles.confirmActionsRowMobile}>
                  <Pressable style={styles.mobileConfirmSecondaryBtn} onPress={closeConfirmModal}>
                    <NativeText style={styles.mobileConfirmSecondaryBtnText}>Cancelar</NativeText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.mobileConfirmPrimaryBtn,
                      confirmType === "delete" && styles.mobileConfirmPrimaryBtnDanger,
                      (createPurchase.isPending || removeItem.isPending) && styles.mobileModalPrimaryBtnDisabled,
                    ]}
                    onPress={() => void onAcceptConfirm()}
                    disabled={createPurchase.isPending || removeItem.isPending}
                  >
                    {createPurchase.isPending || removeItem.isPending ? (
                      <ActivityIndicator
                        color={confirmType === "delete" ? theme.colors.textOnDark : theme.colors.onPrimary}
                      />
                    ) : (
                      <NativeText
                        style={[
                          styles.mobileConfirmPrimaryBtnText,
                          confirmType === "delete" && styles.mobileConfirmPrimaryBtnTextDanger,
                        ]}
                      >
                        {confirmType === "delete" ? "Eliminar" : "Confirmar"}
                      </NativeText>
                    )}
                  </Pressable>
                </View>
              </>
            )}
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
    marginBottom: Platform.OS === "web" ? 10 : 16,
    gap: Platform.OS === "web" ? 10 : 14,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  controlsBlock: {
    gap: Platform.OS === "web" ? 10 : 14,
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
    paddingHorizontal: Platform.OS === "web" ? 14 : 26,
  },
  selectorCard: {
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
  modalBackdropSheet: {
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  formModalSheet: {
    alignSelf: "stretch",
    maxWidth: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: theme.colors.borderOnCard,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: "92%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 18,
      },
      default: {},
    }),
  },
  formContentMobile: {
    gap: 14,
    paddingBottom: 12,
  },
  modalActionsRowMobile: {
    marginTop: 16,
    gap: 12,
    alignItems: "stretch",
  },
  mobileSearchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.text,
    paddingVertical: 0,
  },
  controlsRowMobile: {
    flexDirection: "row",
    gap: 10,
  },
  mobileOutlineBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bgPanel,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  mobileOutlineBtnText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 12,
    color: theme.colors.textOnDark,
    textAlign: "center",
  },
  mobilePrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  mobilePrimaryBtnText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
    color: theme.colors.textOnDark,
  },
  mobileActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.cardElevated,
  },
  mobileActionHintText: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSoft,
  },
  mobileItemCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  priorityBadgeMobile: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: theme.colors.bgPanel,
  },
  itemDividerMobile: {
    height: 12,
  },
  actionsRowMobile: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    alignItems: "stretch",
  },
  mobileActionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.cardElevated,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  mobileActionPillPrimary: {
    backgroundColor: theme.colors.primary,
  },
  mobileActionPillDanger: {
    backgroundColor: theme.colors.cardElevated,
  },
  mobileActionPillLabel: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 12,
    color: theme.colors.text,
  },
  mobileActionPillLabelPrimary: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 12,
    color: theme.colors.onPrimary,
  },
  mobileActionPillLabelDanger: {
    color: theme.colors.danger,
    fontFamily: "Fraunces_700Bold",
  },
  mobilePriorityOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  mobilePriorityOpenLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.textOnDark,
  },
  mobileModalGhostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  mobileModalGhostBtnText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
    color: theme.colors.textSoft,
  },
  mobileModalPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  mobileModalPrimaryBtnDisabled: {
    opacity: 0.65,
  },
  mobileModalPrimaryBtnText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.textOnDark,
  },
  selectorBackdropSheet: {
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  selectorSheet: {
    alignSelf: "stretch",
    maxWidth: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: theme.colors.borderOnCard,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  selectorTitleMobile: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
    marginBottom: 8,
  },
  mobileSheetOption: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.cardElevated,
  },
  mobileSheetOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  mobileSheetOptionText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
  },
  mobileSheetOptionTextSelected: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.textOnDark,
  },
  mobileSheetCloseBtn: {
    alignSelf: "center",
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  mobileSheetCloseBtnText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    color: theme.colors.textSoft,
  },
  mobilePriorityPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 4,
  },
  mobilePriorityPill: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: theme.colors.cardElevated,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  mobilePriorityPillSelected: {
    backgroundColor: theme.colors.primary,
  },
  mobilePriorityPillText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    color: theme.colors.text,
  },
  mobilePriorityPillTextSelected: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.textOnDark,
  },
  confirmSheet: {
    alignSelf: "stretch",
    maxWidth: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: theme.colors.borderOnCard,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 18 },
      default: {},
    }),
  },
  confirmTitleMobile: {
    fontSize: 22,
    lineHeight: 28,
  },
  confirmBodyMobile: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  confirmActionsRowMobile: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  mobileConfirmSecondaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardElevated,
  },
  mobileConfirmSecondaryBtnText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
    color: theme.colors.text,
  },
  mobileConfirmPrimaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  mobileConfirmPrimaryBtnDanger: {
    backgroundColor: "#7D3A35",
  },
  mobileConfirmPrimaryBtnText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  mobileConfirmPrimaryBtnTextDanger: {
    color: theme.colors.textOnDark,
  },
});

