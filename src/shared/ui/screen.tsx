// Contenedor base de pantalla con Safe Area y fondo tematico (gluestack-ui).
import { Box } from "@gluestack-ui/themed";
import { Platform, type ViewProps } from "react-native";
import type { Edges } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_CREAM_BG } from "@/shared/ui/app-colors";

export type ScreenProps = ViewProps & {
  /** Si se omite, se respetan los cuatro insets. En biblioteca se excluye `top` para cabecera a pantalla completa. */
  edges?: Edges;
  /** Solo web: permite ajustar el color del fondo exterior (laterales). */
  webBackgroundColor?: string;
  /** Sustituye el fondo del contenedor seguro (p. ej. pantallas de auth). */
  backgroundColor?: string;
  /** Menos padding superior (pantallas con cabecera de stack nativa). */
  compactTop?: boolean;
};

export function Screen({
  children,
  style,
  edges,
  webBackgroundColor,
  backgroundColor,
  compactTop = false,
}: ScreenProps) {
  const screenBg = backgroundColor ?? APP_CREAM_BG;
  const webUnifiedBg = webBackgroundColor ?? backgroundColor ?? APP_CREAM_BG;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Platform.OS === "web" ? webUnifiedBg : screenBg,
      }}
      edges={edges}
    >
      <Box
        flex={1}
        px="$4"
        pt={compactTop ? "$1" : "$3"}
        w={Platform.OS === "web" ? "100%" : undefined}
        maxWidth={Platform.OS === "web" ? 1120 : undefined}
        alignSelf={Platform.OS === "web" ? "center" : undefined}
        style={style}
      >
        {children}
      </Box>
    </SafeAreaView>
  );
}
