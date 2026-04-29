import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function LoginScreen() {
  const theme = useAppTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Introduce correo y contrasena.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      router.replace("/(app)/(tabs)" as never);
    } catch (error) {
      Alert.alert("No se pudo iniciar sesion", (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: "center",
      gap: 12,
    },
    title: {
      fontWeight: "800",
      fontSize: 26,
      fontFamily: "Fraunces_700Bold",
      color: theme.colors.textOnDark,
    },
    subtitle: {
      color: theme.colors.textMutedOnDark,
      marginBottom: 8,
    },
    registerRow: {
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      marginTop: 8,
    },
    registerHint: {
      color: theme.colors.textMutedOnDark,
    },
    link: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
  });

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Scriptorium</Text>
        <Text style={styles.subtitle}>Inicia sesion para ver tu biblioteca</Text>
        <AppInput
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="tu@email.com"
        />
        <AppInput
          label="Contrasena"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="********"
        />
        <AppButton label={isSubmitting ? "Entrando..." : "Entrar"} onPress={onSubmit} disabled={isSubmitting} />
        <View style={styles.registerRow}>
          <Text style={styles.registerHint}>Aun no tienes cuenta?</Text>
          <Link href={"/(auth)/register" as never} style={styles.link}>
            Registrate
          </Link>
        </View>
      </View>
    </Screen>
  );
}
