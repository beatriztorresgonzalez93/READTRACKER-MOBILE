// Crear o editar un deseo de la wishlist (gluestack-ui).
import { Heading, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";

import { BookSheetScreen } from "@/features/books/book-sheet-ui";
import {
  useCreateWishlistItem,
  useUpdateWishlistItem,
  useWishlistItems,
} from "@/features/wishlist/use-wishlist";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLoader } from "@/shared/ui/app-loader";

const PRIORITY_OPTIONS = [
  { value: "1", label: "Alta" },
  { value: "3", label: "Media" },
  { value: "5", label: "Baja" },
] as const;

function normalizePriority(value: number | string): "1" | "3" | "5" {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "3";
  if (parsed <= 2) return "1";
  if (parsed >= 4) return "5";
  return "3";
}

export default function WishlistItemFormScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const itemsQuery = useWishlistItems();
  const createItem = useCreateWishlistItem();
  const updateItem = useUpdateWishlistItem();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [priority, setPriority] = useState<"1" | "3" | "5">("3");

  const editingItem = useMemo(
    () => (editId ? itemsQuery.data?.find((item) => item.id === editId) : undefined),
    [editId, itemsQuery.data],
  );

  useEffect(() => {
    if (!editingItem) return;
    setTitle(editingItem.title);
    setAuthor(editingItem.author);
    setPrice(editingItem.price);
    setStore(editingItem.store);
    setPriority(normalizePriority(editingItem.priority));
  }, [editingItem]);

  if (editId && itemsQuery.isLoading && !itemsQuery.data) {
    return (
      <BookSheetScreen>
        <AppLoader />
      </BookSheetScreen>
    );
  }

  async function onSave() {
    if (!title.trim() || !author.trim()) {
      Alert.alert("Campos requeridos", "Debes introducir titulo y autor.");
      return;
    }
    const payload = {
      title: title.trim(),
      author: author.trim(),
      price: price.trim() || "Sin precio",
      store: store.trim() || "Sin tienda",
      priority: Math.max(1, Math.min(5, Number(priority) || 3)) as 1 | 2 | 3 | 4 | 5,
    };
    try {
      if (editId) {
        await updateItem.mutateAsync({ itemId: editId, payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message);
    }
  }

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <BookSheetScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          <VStack space="xs">
            <Heading size="xl" color="$primary800">
              {editId ? "Editar deseo" : "Nuevo deseo"}
            </Heading>
            <Text size="sm" color="$textLight700">
              Añade un libro que te gustaría comprar o regalar.
            </Text>
          </VStack>

          <AppInput label="Título" value={title} onChangeText={setTitle} placeholder="Título" />
          <AppInput label="Autor" value={author} onChangeText={setAuthor} placeholder="Autor" />
          <AppInput
            label="Precio"
            value={price}
            onChangeText={setPrice}
            placeholder="ej: 19,90 EUR"
            keyboardType="decimal-pad"
          />
          <AppInput label="Tienda" value={store} onChangeText={setStore} placeholder="ej: Amazon" />

          <VStack space="sm">
            <Text
              size="xs"
              fontWeight="$bold"
              color="$textLight500"
              textTransform="uppercase"
              letterSpacing={0.8}
            >
              Prioridad
            </Text>
            <HStack space="sm">
              {PRIORITY_OPTIONS.map((opt) => {
                const active = priority === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    flex={1}
                    onPress={() => setPriority(opt.value)}
                  >
                    <HStack
                      alignItems="center"
                      justifyContent="center"
                      py="$2.5"
                      borderRadius="$md"
                      borderWidth={1}
                      borderColor={active ? "$primary500" : "$primary200"}
                      bg={active ? "$primary500" : "$backgroundLight50"}
                    >
                      <Text
                        size="sm"
                        fontWeight="$bold"
                        color={active ? "#FFFCF5" : "$primary800"}
                      >
                        {opt.label}
                      </Text>
                    </HStack>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          <AppButton
            label={isSaving ? "Guardando..." : "Guardar deseo"}
            onPress={onSave}
            isDisabled={isSaving}
            isLoading={isSaving}
          />
          <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
        </VStack>
      </ScrollView>
    </BookSheetScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
