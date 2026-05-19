// Bloques UI del detalle de libro (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import type { ReactNode } from "react";

type DetailCardProps = {
  children: ReactNode;
  flex?: number;
};

export function DetailCard({ children, flex }: DetailCardProps) {
  return (
    <Box
      flex={flex}
      bg="$backgroundLight50"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$primary200"
      p="$4"
    >
      {children}
    </Box>
  );
}

type DetailLabelProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  emphasize?: boolean;
};

export function DetailLabel({ icon, label, emphasize }: DetailLabelProps) {
  return (
    <HStack alignItems="center" space="xs" mb="$2">
      <Ionicons name={icon} size={15} color="#7A6555" />
      <Text
        size="xs"
        fontWeight="$bold"
        color={emphasize ? "$primary800" : "$textLight500"}
        textTransform="uppercase"
        letterSpacing={1.2}
      >
        {label}
      </Text>
    </HStack>
  );
}

export function StarRow({ rating }: { rating?: number | null }) {
  const raw = rating != null && Number.isFinite(rating) ? rating : 0;
  const normalized = raw > 5 ? raw / 2 : raw;
  const full = Math.min(5, Math.max(0, Math.round(normalized)));
  return (
    <HStack space="xs">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? "star" : "star-outline"}
          size={16}
          color="#A87D42"
        />
      ))}
    </HStack>
  );
}

export function DetailChip({ children }: { children: ReactNode }) {
  return (
    <Box
      px="$2.5"
      py="$1"
      borderRadius="$md"
      bg="rgba(168, 125, 66, 0.15)"
      borderWidth={1}
      borderColor="$primary200"
    >
      <Text size="sm" fontWeight="$bold" color="$primary800">
        {children}
      </Text>
    </Box>
  );
}

type DetailTabBarProps = {
  tabs: readonly string[];
  activeTab: string;
  onSelect: (tab: string) => void;
};

export function DetailTabBar({ tabs, activeTab, onSelect }: DetailTabBarProps) {
  return (
    <HStack borderTopWidth={1} borderTopColor="$primary200" pt="$2" mt="$2">
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable key={tab} flex={1} onPress={() => onSelect(tab)} accessibilityRole="tab">
            <VStack alignItems="center" space="xs">
              <Text
                size="sm"
                fontWeight="$bold"
                color={active ? "$primary500" : "$textLight500"}
                letterSpacing={1}
              >
                {tab}
              </Text>
              <Box
                h={2}
                w="48%"
                borderRadius="$full"
                bg={active ? "$primary400" : "transparent"}
              />
            </VStack>
          </Pressable>
        );
      })}
    </HStack>
  );
}
