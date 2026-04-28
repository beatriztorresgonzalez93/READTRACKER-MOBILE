import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { useAuth } from "@/features/auth/use-auth";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  async function onLogout() {
    await logout();
    Alert.alert("Sesion cerrada");
    router.replace("/(auth)/login" as never);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Card mode="outlined" style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.name}>
              {user?.name ?? user?.firstName ?? "Lector/a"}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email}
            </Text>
          </Card.Content>
        </Card>
        <Button mode="contained" style={styles.logoutButton} onPress={onLogout}>
          Cerrar sesion
        </Button>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  name: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  email: {
    color: theme.colors.textSoft,
  },
  logoutButton: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
});

