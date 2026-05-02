// Pantalla de registro de usuario con validacion y feedback.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { useAuth } from "@/features/auth/use-auth";
import { subscriptionCopy } from "@/features/billing/subscription-copy";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function RegisterScreen() {
  const registerSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    email: z.string().trim().email("Introduce un correo valido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  });
  const theme = useAppTheme();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  async function onSubmit() {
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      await register(parsed.data);
      router.replace("/(app)/(tabs)" as never);
    } catch (error) {
      Alert.alert("No se pudo crear la cuenta", (error as Error).message);
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
    trialBanner: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgSoft,
      marginBottom: 4,
    },
    trialBannerText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.text,
    },
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <View style={styles.wrapper}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Comienza a registrar tus lecturas</Text>
          <View style={styles.trialBanner} accessibilityRole="text">
            <Ionicons name="gift-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.trialBannerText}>{subscriptionCopy.trialLead}</Text>
          </View>
          <AppInput
            label="Nombre"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Tu nombre"
            error={errors.name}
          />
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
            label="Contraseña"
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
          <AppButton
            label={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            onPress={onSubmit}
            disabled={isSubmitting}
          />
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Ya tienes cuenta?</Text>
            <Link href={"/(auth)/login" as never} style={styles.link}>
              Inicia sesión
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
