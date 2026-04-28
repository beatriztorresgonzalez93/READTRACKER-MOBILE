import { SafeAreaView } from "react-native-safe-area-context";
import type { Edges } from "react-native-safe-area-context";
import { StyleSheet, View, type ViewProps } from "react-native";
import { theme } from "@/shared/ui/theme";

export type ScreenProps = ViewProps & {
  /** Si se omite, se respetan los cuatro insets. En biblioteca se excluye `top` para cabecera a pantalla completa. */
  edges?: Edges;
};

export function Screen({ children, style, edges }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

