// Estado vacio reutilizable para listas sin resultados (gluestack-ui).
import { Box, Text, VStack } from "@gluestack-ui/themed";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Box
      borderRadius="$lg"
      bg="$backgroundLight50"
      p="$4"
      borderWidth={1}
      borderColor="$primary200"
    >
      <VStack space="xs">
        <Text size="md" fontWeight="$bold" color="$primary800">
          {title}
        </Text>
        {description ? (
          <Text size="sm" color="$textLight500" lineHeight={20}>
            {description}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
}
