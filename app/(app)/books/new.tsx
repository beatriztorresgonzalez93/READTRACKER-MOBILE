import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function NewBookScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Anadir libro</Text>
      <Text style={styles.body}>
        Pronto podras crear libros desde la app. Mientras tanto, usa la web de Scriptorium para dar de alta titulos nuevos.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    color: theme.colors.textOnDark,
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMutedOnDark,
  },
});
