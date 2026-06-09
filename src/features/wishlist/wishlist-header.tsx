// Cabecera de wishlist: búsqueda, filtros y acciones.
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Platform } from "react-native";

import { WishlistRecentPurchases } from "@/features/wishlist/wishlist-recent-purchases";
import { ActiveFilterChips, type ActiveFilterChip } from "@/shared/ui/active-filter-chips";
import { AppButton } from "@/shared/ui/app-button";

const isWeb = Platform.OS === "web";

type WishlistHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  wishlistFiltersActive: boolean;
  activeFilterChips: ActiveFilterChip[];
  showHeading: boolean;
};

export function WishlistHeader({
  search,
  onSearchChange,
  wishlistFiltersActive,
  activeFilterChips,
  showHeading,
}: WishlistHeaderProps) {
  return (
    <VStack space="md" mb="$3" px={isWeb ? "$1" : "$3"}>
      <HStack alignItems="center" space="sm">
        <Input
          flex={1}
          size="lg"
          variant="outline"
          borderRadius={isWeb ? "$md" : "$lg"}
          bg="$white"
          borderColor="$primary200"
        >
          <InputSlot pl="$3">
            <Ionicons name="search-outline" size={18} color="#7A6555" />
          </InputSlot>
          <InputField
            placeholder="Buscar en lista de deseos..."
            value={search}
            onChangeText={onSearchChange}
            color="$primary800"
            placeholderTextColor="$textLight500"
            accessibilityLabel="Buscar en wishlist"
          />
        </Input>

        <Pressable
          onPress={() => router.push("/(app)/wishlist-filters" as never)}
          accessibilityLabel="Filtros y orden"
          accessibilityRole="button"
        >
          <Box
            w={isWeb ? 44 : 38}
            h={isWeb ? 44 : 38}
            borderRadius="$full"
            borderWidth={1}
            borderColor={wishlistFiltersActive ? "$primary500" : "$primary400"}
            bg={wishlistFiltersActive ? "$primary500" : "transparent"}
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons
              name="options-outline"
              size={isWeb ? 22 : 18}
              color={wishlistFiltersActive ? "#FFFCF5" : "#A87D42"}
            />
          </Box>
        </Pressable>
      </HStack>

      <ActiveFilterChips chips={activeFilterChips} />

      <AppButton
        label="Añadir deseo"
        onPress={() => router.push("/(app)/wishlist/item-form" as never)}
        alignSelf={isWeb ? "flex-start" : "stretch"}
      />

      <WishlistRecentPurchases />

      {showHeading ? (
        <Heading size="md" color="$primary800">
          Tus deseos
        </Heading>
      ) : null}
    </VStack>
  );
}
