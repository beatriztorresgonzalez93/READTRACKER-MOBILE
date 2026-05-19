// Tarjeta de compra registrada (gluestack-ui).
import { Box, HStack, Text } from "@gluestack-ui/themed";

type PurchaseListCardProps = {
  title: string;
  author?: string;
  price?: string;
  store?: string;
  dateLabel?: string;
};

export function PurchaseListCard({
  title,
  author,
  price,
  store,
  dateLabel,
}: PurchaseListCardProps) {
  return (
    <Box
      bg="$backgroundLight50"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$primary200"
      p="$4"
      gap="$1"
    >
      <Text size="md" fontWeight="$bold" color="$primary800">
        {title}
      </Text>
      <Text size="sm" color="$textLight500">
        {author || "Autor no definido"}
      </Text>
      <HStack flexWrap="wrap" alignItems="center" space="xs" mt="$1">
        <Text size="sm" color="$textLight500">
          {price || "Sin precio"}
        </Text>
        <Text size="sm" color="$textLight400">
          ·
        </Text>
        <Text size="sm" color="$textLight500">
          {store || "Sin tienda"}
        </Text>
      </HStack>
      {dateLabel ? (
        <Text size="xs" color="$primary500" mt="$1">
          {dateLabel}
        </Text>
      ) : null}
    </Box>
  );
}
