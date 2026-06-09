// Cabecera de biblioteca: búsqueda, filtros y acciones.
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

import { AppButton } from "@/shared/ui/app-button";
import { ActiveFilterChips, type ActiveFilterChip } from "@/shared/ui/active-filter-chips";

const isWeb = Platform.OS === "web";

type LibraryHeaderProps = {
  topInset: number;
  searchDraft: string;
  onSearchChange: (value: string) => void;
  filtered: boolean;
  activeFilterChips: ActiveFilterChip[];
};

export function LibraryHeader({
  topInset,
  searchDraft,
  onSearchChange,
  filtered,
  activeFilterChips,
}: LibraryHeaderProps) {
  return (
    <Box width="100%" alignSelf="stretch">
      <Box h={isWeb ? topInset + 72 : 0} />
      <VStack
        px={isWeb ? "$4" : "$3"}
        pt="$1"
        pb="$2"
        space="md"
        width="100%"
        maxWidth={1220}
        alignSelf="center"
      >
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
              testID="library-searchbar"
              accessibilityLabel="Buscar en biblioteca"
              placeholder="Título, autor, género o año..."
              value={searchDraft}
              onChangeText={onSearchChange}
              color="$primary800"
              placeholderTextColor="$textLight500"
            />
          </Input>

          <Pressable
            onPress={() => router.push("/(app)/library-filters" as never)}
            accessibilityLabel="Abrir filtros de biblioteca"
            accessibilityRole="button"
          >
            <Box
              w={isWeb ? 44 : 38}
              h={isWeb ? 44 : 38}
              borderRadius="$full"
              borderWidth={1}
              borderColor={filtered ? "$primary500" : "$primary400"}
              bg={filtered ? "$primary500" : "transparent"}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name="options-outline"
                size={isWeb ? 22 : 18}
                color={filtered ? "#FFFCF5" : "#A87D42"}
              />
            </Box>
          </Pressable>
        </HStack>

        <ActiveFilterChips chips={activeFilterChips} />

        <AppButton
          label="Añadir libro"
          onPress={() => router.push("/(app)/books/new" as never)}
          alignSelf={isWeb ? "flex-start" : "stretch"}
        />

        <Heading size="lg" color="$primary800">
          Tus libros
        </Heading>
      </VStack>
    </Box>
  );
}
