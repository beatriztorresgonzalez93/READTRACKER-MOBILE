import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!name || !email || !password) {
      Alert.alert("Campos requeridos", "Completa nombre, correo y contrasena.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({ name, email, password });
      router.replace("/(app)/(tabs)" as never);
    } catch (error) {
      Alert.alert("No se pudo crear la cuenta", (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Comienza a registrar tus lecturas</Text>
        <AppInput label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
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
        <AppButton
          label={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          onPress={onSubmit}
          disabled={isSubmitting}
        />
        <View style={styles.registerRow}>
          <Text style={styles.registerHint}>Ya tienes cuenta?</Text>
          <Link href={"/(auth)/login" as never} style={styles.link}>
            Inicia sesion
          </Link>
        </View>
      </View>
    </Screen>
  );
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

