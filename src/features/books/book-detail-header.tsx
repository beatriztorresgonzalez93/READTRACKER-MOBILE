// Cabecera del detalle de libro: portada, metadatos y pestañas.
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";

import { DetailTabBar, StarRow } from "@/features/books/book-detail-ui";
import { BookCover } from "@/shared/ui/book-cover";

type BookDetailHeaderProps = {
  title?: string;
  author?: string;
  coverUrl?: string | null;
  rating?: number | null;
  isFavorite: boolean;
  tabs: readonly string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
};

export function BookDetailHeader({
  title,
  author,
  coverUrl,
  rating,
  isFavorite,
  tabs,
  activeTab,
  onSelectTab,
}: BookDetailHeaderProps) {
  return (
    <Box px="$4" pt="$3" pb="$2" bg="$backgroundLight50" borderBottomWidth={1} borderBottomColor="$primary200">
      <HStack space="md" alignItems="flex-start">
        <BookCover
          uri={coverUrl}
          title={title}
          width={82}
          aspectRatio={1.45}
          borderRadius={4}
          accessibilityLabel={`Portada: ${title}`}
        />
        <VStack flex={1} space="xs" minWidth={0}>
          <Text size="2xl" fontWeight="$bold" color="$primary800" lineHeight={30}>
            {title}
          </Text>
          <Text size="sm" fontStyle="italic" fontWeight="$bold" color="$primary500">
            {author ?? "Autor desconocido"}
          </Text>
          <HStack alignItems="center" space="sm" mt="$1">
            <StarRow rating={rating} />
            {isFavorite ? (
              <HStack alignItems="center" space="xs">
                <Ionicons name="heart" size={12} color="#D14E72" />
                <Text size="xs" fontWeight="$bold" color="#D14E72">
                  Favorito
                </Text>
              </HStack>
            ) : null}
          </HStack>
        </VStack>
      </HStack>
      <DetailTabBar tabs={tabs} activeTab={activeTab} onSelect={onSelectTab} />
    </Box>
  );
}
