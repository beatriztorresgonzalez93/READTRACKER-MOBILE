// Navegación de mes en historial de lectura.
import { Ionicons } from "@expo/vector-icons";
import { HStack, Pressable, Text } from "@gluestack-ui/themed";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

type HistoryMonthHeaderProps = {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function HistoryMonthHeader({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
}: HistoryMonthHeaderProps) {
  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      mb={isWeb ? "$2" : "$4"}
      gap="$2"
    >
      <Pressable
        onPress={onPreviousMonth}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        w={44}
        h={44}
        borderRadius="$full"
        borderWidth={1}
        borderColor="$primary200"
        bg="$white"
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name="chevron-back" size={22} color="#A87D42" />
      </Pressable>
      <Text
        flex={1}
        size={isWeb ? "md" : "lg"}
        fontWeight="$bold"
        color="$primary800"
        textAlign="center"
        textTransform="capitalize"
        numberOfLines={1}
      >
        {monthLabel}
      </Text>
      <Pressable
        onPress={onNextMonth}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        w={44}
        h={44}
        borderRadius="$full"
        borderWidth={1}
        borderColor="$primary200"
        bg="$white"
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name="chevron-forward" size={22} color="#A87D42" />
      </Pressable>
    </HStack>
  );
}
