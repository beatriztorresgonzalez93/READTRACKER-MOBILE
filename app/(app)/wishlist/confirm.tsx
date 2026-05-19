// Confirmar compra o eliminación de un deseo (gluestack-ui).
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { BookConfirmLayout, BookSheetScreen } from "@/features/books/book-sheet-ui";
import {
  useCreatePurchase,
  useDeleteWishlistItem,
} from "@/features/wishlist/use-wishlist";
import { AppButton } from "@/shared/ui/app-button";

export default function WishlistConfirmScreen() {
  const { type, itemId, title } = useLocalSearchParams<{
    type: "purchase" | "delete";
    itemId: string;
    title?: string;
  }>();
  const createPurchase = useCreatePurchase();
  const removeItem = useDeleteWishlistItem();

  const isPurchase = type === "purchase";
  const pending = createPurchase.isPending || removeItem.isPending;

  async function onConfirm() {
    if (!itemId) return;
    try {
      if (isPurchase) {
        await createPurchase.mutateAsync(itemId);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await removeItem.mutateAsync(itemId);
      }
      router.back();
    } catch (error) {
      Alert.alert("No se pudo completar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <BookConfirmLayout
        title={isPurchase ? "Marcar como comprado" : "Eliminar deseo"}
        body={
          isPurchase
            ? `¿Quieres marcar "${title ?? "este libro"}" como comprado?`
            : `¿Seguro que quieres eliminar "${title ?? "este deseo"}" de tu wishlist?`
        }
      >
        <AppButton
          label={isPurchase ? "Confirmar" : "Eliminar"}
          onPress={onConfirm}
          isDisabled={pending}
          isLoading={pending}
        />
        <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
      </BookConfirmLayout>
    </BookSheetScreen>
  );
}
