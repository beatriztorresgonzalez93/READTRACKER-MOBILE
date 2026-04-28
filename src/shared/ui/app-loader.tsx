import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "@/shared/ui/theme";

export function AppLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.bg,
  },
});
