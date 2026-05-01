// Contenedor base de pantalla con Safe Area y fondo tematico.
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edges } from "react-native-safe-area-context";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export type ScreenProps = ViewProps & {
  /** Si se omite, se respetan los cuatro insets. En biblioteca se excluye `top` para cabecera a pantalla completa. */
  edges?: Edges;
};

export function Screen({ children, style, edges }: ScreenProps) {
  const theme = useAppTheme();
  const webUnifiedBg = theme.colors.bgSoft;
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Platform.OS === "web" ? webUnifiedBg : theme.colors.bg,
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
      backgroundColor: webUnifiedBg,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.content, Platform.OS === "web" && styles.contentWeb, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
