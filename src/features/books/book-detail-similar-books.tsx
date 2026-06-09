// Sección de libros similares en el detalle.
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@gluestack-ui/themed";

import { DetailCard } from "@/features/books/book-detail-ui";
import type { SimilarBookEntry } from "@/features/books/use-similar-books";
import { BookCover } from "@/shared/ui/book-cover";

type BookDetailSimilarBooksProps = {
  similarBooks: SimilarBookEntry[];
};

export function BookDetailSimilarBooks({ similarBooks }: BookDetailSimilarBooksProps) {
  return (
    <DetailCard>
      <Text
        size="xs"
        fontWeight="$bold"
        color="$textLight500"
        textTransform="uppercase"
        letterSpacing={1.2}
        mb="$1"
      >
        Similares
      </Text>
      <Text size="sm" color="$textLight500" mb="$3">
        Libros que podrían interesarte por género o etiquetas en común.
      </Text>
      <View style={styles.similarGrid}>
        {similarBooks.map(({ book: item, reason }) => (
          <Link key={item.id} href={`/(app)/books/${item.id}` as never} asChild>
            <Pressable style={styles.similarCard}>
              <BookCover
                uri={item.coverUrl}
                title={item.title}
                width={102}
                aspectRatio={1.45}
                borderRadius={6}
                accessibilityLabel={`Portada: ${item.title}`}
              />
              <Text size="sm" fontWeight="$bold" color="$primary800" numberOfLines={2}>
                {item.title}
              </Text>
              <Text size="xs" color="$textLight500" fontStyle="italic" numberOfLines={1}>
                {reason}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
      {similarBooks.length === 0 ? (
        <Text size="sm" color="$textLight500" fontStyle="italic">
          Aún no hay suficientes coincidencias por género o etiquetas.
        </Text>
      ) : null}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  similarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  similarCard: {
    width: 108,
    gap: 4,
  },
});
