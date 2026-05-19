// Confirmar eliminación de una sesión de lectura (gluestack-ui).
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { BookConfirmLayout, BookSheetScreen } from "@/features/books/book-sheet-ui";
import { useDeleteReadingSession } from "@/features/readingSessions/use-history";
import { AppButton } from "@/shared/ui/app-button";

export default function DeleteSessionScreen() {
  const { sessionId, title } = useLocalSearchParams<{ sessionId: string; title?: string }>();
  const deleteSession = useDeleteReadingSession();

  async function onConfirm() {
    if (!sessionId) return;
    try {
      await deleteSession.mutateAsync(sessionId);
      router.back();
    } catch (error) {
      Alert.alert("No se pudo eliminar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <BookConfirmLayout
        title="Eliminar sesión"
        body={`¿Seguro que quieres eliminar la sesión de "${title ?? "esta lectura"}"?`}
      >
        <AppButton
          label={deleteSession.isPending ? "Eliminando..." : "Eliminar"}
          onPress={onConfirm}
          isDisabled={deleteSession.isPending}
          isLoading={deleteSession.isPending}
        />
        <AppButton label="Cancelar" appearance="secondary" onPress={() => router.back()} />
      </BookConfirmLayout>
    </BookSheetScreen>
  );
}
