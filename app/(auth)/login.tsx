import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { useAuth } from "@/features/auth/use-auth";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function LoginScreen() {
  const loginSchema = z.object({
    email: z.string().trim().email("Introduce un correo valido."),
    password: z.string().min(1, "La contrasena es obligatoria."),
  });
  const theme = useAppTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      await login(parsed.data);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <View style={styles.wrapper}>
          <Text style={styles.title}>Scriptorium</Text>
          <Text style={styles.subtitle}>Inicia sesion para ver tu biblioteca</Text>
          <AppInput
            label="Correo"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="tu@email.com"
            error={errors.email}
          />
          <AppInput
            label="Contrasena"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="********"
            error={errors.password}
          />
          <AppButton label={isSubmitting ? "Entrando..." : "Entrar"} onPress={onSubmit} disabled={isSubmitting} />
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Aun no tienes cuenta?</Text>
            <Link href={"/(auth)/register" as never} style={styles.link}>
              Registrate
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
