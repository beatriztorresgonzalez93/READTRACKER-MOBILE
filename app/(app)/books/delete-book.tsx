// Confirmar eliminación de un libro (gluestack-ui).
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { BookConfirmLayout, BookSheetScreen } from "@/features/books/book-sheet-ui";
import { useDeleteBook } from "@/features/books/use-books";
import { AppButton } from "@/shared/ui/app-button";

export default function BookDeleteScreen() {
  const { id: bookId } = useLocalSearchParams<{ id: string }>();
  const deleteBook = useDeleteBook(bookId);

  async function onConfirm() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteBook.mutateAsync();
      router.replace("/(app)/(tabs)/home" as never);
    } catch (error) {
      Alert.alert("No se pudo eliminar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <BookConfirmLayout
        title="Eliminar libro"
        body="¿Seguro que quieres eliminar este libro? Esta accion no se puede deshacer."
      >
        <AppButton
          label={deleteBook.isPending ? "Eliminando..." : "Eliminar"}
          onPress={onConfirm}
          isDisabled={deleteBook.isPending}
          isLoading={deleteBook.isPending}
        />
        <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
      </BookConfirmLayout>
    </BookSheetScreen>
  );
}
