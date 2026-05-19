// Chips de filtros activos con acción para quitar (biblioteca, wishlist).
import { Ionicons } from "@expo/vector-icons";
import { HStack, Pressable, ScrollView, Text } from "@gluestack-ui/themed";

export type ActiveFilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
};

export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {chips.map((chip) => (
        <HStack
          key={chip.id}
          alignItems="center"
          space="xs"
          borderRadius="$full"
          borderWidth={1}
          borderColor="$primary300"
          bg="$white"
          pl="$3"
          pr="$1.5"
          py="$1.5"
        >
          <Text size="sm" fontWeight="$semibold" color="$primary800">
            {chip.label}
          </Text>
          <Pressable
            onPress={chip.onRemove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Quitar filtro ${chip.label}`}
          >
            <Ionicons name="close-circle" size={20} color="#7A6555" />
          </Pressable>
        </HStack>
      ))}
    </ScrollView>
  );
}
