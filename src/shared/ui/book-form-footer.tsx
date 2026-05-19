// Pie fijo para formularios de libro (guardar sin tapar campos del scroll).
import { Box } from "@gluestack-ui/themed";
import type { ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CREAM_BG } from "@/shared/ui/app-colors";

type BookFormFooterProps = {
  children: ReactNode;
};

export function BookFormFooter({ children }: BookFormFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 16 : 12);

  return (
    <Box
      borderTopWidth={StyleSheet.hairlineWidth}
      borderTopColor="$primary200"
      bg={APP_CREAM_BG}
      pt="$3"
      pb={bottomPad}
    >
      {children}
    </Box>
  );
}
