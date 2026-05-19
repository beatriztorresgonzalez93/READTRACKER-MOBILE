// Cambiar estado de lectura del libro (gluestack-ui).
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { VStack } from "@gluestack-ui/themed";

import {
  BookOptionList,
  BookOptionRow,
  BookSheetScreen,
} from "@/features/books/book-sheet-ui";
import { useBookDetail, useUpdateBookStatus } from "@/features/books/use-books";
import { AppLoader } from "@/shared/ui/app-loader";

const STATUS_OPTIONS = ["pendiente", "leyendo", "leido"] as const;

export default function BookStatusScreen() {
  const { id: bookId } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useBookDetail(bookId);
  const updateStatus = useUpdateBookStatus(bookId);
  const book = detailQuery.data;
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("pendiente");

  useEffect(() => {
    const fromBook = book?.status;
    if (fromBook === "pendiente" || fromBook === "leyendo" || fromBook === "leido") {
      setSelectedStatus(fromBook);
    }
  }, [book?.status]);

  if (detailQuery.isLoading && !book) {
    return (
      <BookSheetScreen>
        <AppLoader />
      </BookSheetScreen>
    );
  }

  async function onPick(status: (typeof STATUS_OPTIONS)[number]) {
    const previous = selectedStatus;
    setSelectedStatus(status);
    try {
      await updateStatus.mutateAsync(status);
      router.back();
    } catch (error) {
      setSelectedStatus(previous);
      Alert.alert("No se pudo actualizar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <VStack flex={1} pt="$1" space="md">
        <BookOptionList>
          {STATUS_OPTIONS.map((status) => (
            <BookOptionRow
              key={status}
              label={status.toUpperCase()}
              active={status === selectedStatus}
              onPress={() => onPick(status)}
              disabled={updateStatus.isPending}
            />
          ))}
        </BookOptionList>
      </VStack>
    </BookSheetScreen>
  );
}
