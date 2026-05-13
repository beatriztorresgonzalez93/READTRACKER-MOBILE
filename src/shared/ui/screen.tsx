// Contenedor base de pantalla con Safe Area y fondo tematico.
import { useAppTheme } from "@/shared/ui/use-app-theme";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import type { Edges } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

export type ScreenProps = ViewProps & {
  /** Si se omite, se respetan los cuatro insets. En biblioteca se excluye `top` para cabecera a pantalla completa. */
  edges?: Edges;
  /** Solo web: permite ajustar el color del fondo exterior (laterales). */
  webBackgroundColor?: string;
  /** Sustituye el fondo del contenedor seguro (p. ej. pantallas de auth). */
  backgroundColor?: string;
};

export function Screen({ children, style, edges, webBackgroundColor, backgroundColor }: ScreenProps) {
  const theme = useAppTheme();
  const screenBg = backgroundColor ?? theme.colors.bg;
  const webUnifiedBg = webBackgroundColor ?? backgroundColor ?? theme.colors.bgSoft;
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Platform.OS === "web" ? webUnifiedBg : screenBg,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    contentWeb: {
      width: "100%",
      maxWidth: 1120,
      alignSelf: "center",
      backgroundColor: "transparent",
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View
        style={[
          styles.content,
          Platform.OS === "web" && styles.contentWeb,
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
