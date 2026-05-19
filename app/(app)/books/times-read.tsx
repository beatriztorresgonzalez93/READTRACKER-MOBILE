// Elegir cuántas veces se ha leído el libro (gluestack-ui).
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { VStack } from "@gluestack-ui/themed";

import {
  BookOptionList,
  BookOptionRow,
  BookSheetScreen,
} from "@/features/books/book-sheet-ui";
import { useBookDetail, useUpdateBook } from "@/features/books/use-books";
import { AppLoader } from "@/shared/ui/app-loader";

const TIMES_READ_OPTIONS = [
  "No leido aun",
  "1ª vez",
  "2ª vez",
  "3ª vez",
  "4ª vez",
  "5ª vez o mas",
] as const;

export default function BookTimesReadScreen() {
  const { id: bookId } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useBookDetail(bookId);
  const updateBook = useUpdateBook(bookId);
  const book = detailQuery.data;
  const current =
    book?.timesRead && TIMES_READ_OPTIONS.includes(book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
      ? (book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
      : "No leido aun";

  if (detailQuery.isLoading && !book) {
    return (
      <BookSheetScreen>
        <AppLoader />
      </BookSheetScreen>
    );
  }

  async function onPick(option: (typeof TIMES_READ_OPTIONS)[number]) {
    try {
      await updateBook.mutateAsync({ timesRead: option, status: book?.status });
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message);
    }
  }

  return (
    <BookSheetScreen>
      <VStack flex={1} p="$4" space="md">
        <BookOptionList>
          {TIMES_READ_OPTIONS.map((option) => (
            <BookOptionRow
              key={option}
              label={option}
              active={option === current}
              onPress={() => onPick(option)}
              disabled={updateBook.isPending}
            />
          ))}
        </BookOptionList>
      </VStack>
    </BookSheetScreen>
  );
}
