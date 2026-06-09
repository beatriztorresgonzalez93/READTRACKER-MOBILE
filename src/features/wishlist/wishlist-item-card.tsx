// Tarjeta de un deseo en la wishlist.
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { Platform } from "react-native";

import { wishlistPriorityLabel } from "@/features/wishlist/wishlist-priority";
import type { WishlistItem } from "@/shared/types/wishlist";

const isWeb = Platform.OS === "web";

type WishlistItemCardProps = {
  item: WishlistItem;
  onPurchase: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
};

export function WishlistItemCard({
  item,
  onPurchase,
  onEdit,
  onDelete,
  deleteDisabled,
}: WishlistItemCardProps) {
  return (
    <Box
      borderRadius="$xl"
      bg="$white"
      borderWidth={1}
      borderColor="$primary200"
      p="$4"
      gap="$2"
    >
      <Box
        alignSelf="flex-start"
        borderRadius="$full"
        bg="$primary700"
        px="$2"
        py="$0.5"
      >
        <Text size="2xs" fontWeight="$bold" color="$white" letterSpacing={0.8}>
          {wishlistPriorityLabel(item.priority)}
        </Text>
      </Box>

      <Text size="lg" fontWeight="$bold" color="$primary800" numberOfLines={2}>
        {item.title}
      </Text>
      <Text size="sm" color="$textLight500">
        {item.author ?? "Autor no definido"}
      </Text>

      <HStack justifyContent="space-between" alignItems="center" mt="$1">
        <Text flex={1} size="xs" color="$textLight500" numberOfLines={1} mr="$2">
          {item.store || "Sin tienda"}
        </Text>
        <Text size="sm" fontWeight="$bold" color="$primary800">
          {item.price || "—"}
        </Text>
      </HStack>

      {isWeb ? (
        <HStack space="sm" mt="$2">
          <Pressable
            onPress={onPurchase}
            accessibilityLabel="Marcar como comprado"
            accessibilityRole="button"
          >
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              bg="$primary500"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="checkmark" size={18} color="#FFFCF5" />
            </Box>
          </Pressable>
          <Pressable onPress={onEdit} accessibilityLabel="Editar deseo" accessibilityRole="button">
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              borderWidth={1}
              borderColor="$primary200"
              bg="$primary50"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="pencil-outline" size={16} color="#7A6555" />
            </Box>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={deleteDisabled}
            accessibilityLabel="Eliminar deseo"
            accessibilityRole="button"
          >
            <Box
              w={36}
              h={36}
              borderRadius="$md"
              borderWidth={1}
              borderColor="$primary200"
              bg="$primary50"
              alignItems="center"
              justifyContent="center"
              opacity={deleteDisabled ? 0.5 : 1}
            >
              <Ionicons name="trash-outline" size={16} color="#7A6555" />
            </Box>
          </Pressable>
        </HStack>
      ) : (
        <HStack space="sm" mt="$3" flexWrap="wrap">
          <Pressable
            flex={1}
            onPress={onPurchase}
            accessibilityLabel="Marcar como comprado"
            accessibilityRole="button"
          >
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary500"
              py="$2.5"
              px="$2"
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFCF5" />
              <Text size="xs" fontWeight="$bold" color="$white">
                Comprado
              </Text>
            </HStack>
          </Pressable>
          <Pressable flex={1} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Editar">
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary50"
              py="$2.5"
              px="$2"
            >
              <Ionicons name="create-outline" size={18} color="#2D1F15" />
              <Text size="xs" color="$primary800">
                Editar
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            flex={1}
            onPress={onDelete}
            disabled={deleteDisabled}
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
          >
            <HStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              space="xs"
              borderRadius="$lg"
              bg="$primary50"
              py="$2.5"
              px="$2"
              opacity={deleteDisabled ? 0.5 : 1}
            >
              <Ionicons name="trash-outline" size={18} color="#B42318" />
              <Text size="xs" color="#B42318" fontWeight="$bold">
                Eliminar
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      )}
    </Box>
  );
}
