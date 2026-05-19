// Layout compartido de subpantallas de libro (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import { Box, Heading, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import type { ReactNode } from "react";

import { APP_CREAM_BG } from "@/shared/ui/app-colors";
import { Screen } from "@/shared/ui/screen";

export const BOOK_SHEET_BG = APP_CREAM_BG;

export function BookSheetScreen({ children }: { children: ReactNode }) {
  return (
    <Screen
      backgroundColor={BOOK_SHEET_BG}
      webBackgroundColor={BOOK_SHEET_BG}
      edges={["bottom", "left", "right"]}
      compactTop
      style={{ flex: 1 }}
    >
      {children}
    </Screen>
  );
}

export function BookSheetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <VStack
      space="xs"
      pb="$3"
      mb="$1"
      borderBottomWidth={1}
      borderBottomColor="$primary200"
    >
      <Heading size="lg" color="$primary800">
        {title}
      </Heading>
      {subtitle ? (
        <Text size="sm" color="$textLight500">
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

export function BookSheetLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      size="xs"
      fontWeight="$bold"
      color="$textLight500"
      textTransform="uppercase"
      letterSpacing={0.8}
      style={{ marginBottom: 8 }}
    >
      {children}
    </Text>
  );
}

/** Bloque de formulario con separación vertical fiable. */
export function BookSheetSection({ children }: { children: ReactNode }) {
  return (
    <Box width="$full" style={{ marginBottom: 28 }}>
      {children}
    </Box>
  );
}

export function BookOptionList({ children }: { children: ReactNode }) {
  return (
    <Box
      bg="$backgroundLight50"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$primary200"
      py="$1"
      overflow="hidden"
    >
      {children}
    </Box>
  );
}

type BookOptionRowProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function BookOptionRow({ label, active, onPress, disabled }: BookOptionRowProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <HStack
        alignItems="center"
        justifyContent="space-between"
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderBottomColor="$primary100"
      >
        <Text
          fontWeight="$bold"
          letterSpacing={0.6}
          color={active ? "$primary600" : "$primary800"}
        >
          {label}
        </Text>
        {active ? (
          <Ionicons name="checkmark" size={18} color="#A87D42" />
        ) : (
          <Box w={18} />
        )}
      </HStack>
    </Pressable>
  );
}

export function BookProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <Box h={8} borderRadius="$full" bg="$primary200" overflow="hidden">
      <Box
        h="100%"
        bg="$primary500"
        borderRadius="$full"
        style={{ width: `${clamped}%` }}
      />
    </Box>
  );
}

type BookConfirmLayoutProps = {
  title: string;
  body: string;
  children: ReactNode;
};

export function BookConfirmLayout({ title, body, children }: BookConfirmLayoutProps) {
  return (
    <VStack flex={1} justifyContent="center" p="$5" space="lg">
      <Heading size="xl" color="$primary800">
        {title}
      </Heading>
      <Text size="md" color="$textLight700" lineHeight={22}>
        {body}
      </Text>
      <VStack space="sm">{children}</VStack>
    </VStack>
  );
}
