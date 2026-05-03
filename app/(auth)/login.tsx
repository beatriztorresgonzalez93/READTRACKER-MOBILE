// Pantalla de inicio de sesion con validacion de formulario.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { useAuthFormScroll } from "@/features/auth/use-auth-form-scroll";
import { useAuth } from "@/features/auth/use-auth";
import { subscriptionCopy } from "@/features/billing/subscription-copy";
import { formatFirebaseAuthError } from "@/shared/lib/firebase-auth-errors";
import { showAppAlert } from "@/shared/lib/show-app-alert";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function LoginScreen() {
  const { scrollRef, scrollPasswordFieldIntoView } = useAuthFormScroll();
  const headerHeight = useHeaderHeight();

  const loginSchema = z.object({
    email: z.string().trim().email("Introduce un correo valido."),
    password: z.string().min(1, "La contraseña es obligatoria."),
  });
  const theme = useAppTheme();
  const { login, isAuthenticated, syncError, clearSyncError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        requestAnimationFrame(() => {
          (document.activeElement as HTMLElement | null)?.blur?.();
        });
      }
    }, [])
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(app)/(tabs)" as never);
    }
  }, [isAuthenticated]);

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
      clearSyncError();
      await login(parsed.data);
    } catch (error) {
      showAppAlert("No se pudo iniciar sesión", formatFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
      gap: 12,
      paddingTop: 8,
      paddingBottom: 160,
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
    syncErrorBox: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.bgSoft,
      marginBottom: 4,
    },
    syncErrorText: {
      color: theme.colors.textOnDark,
      fontSize: 14,
      lineHeight: 20,
    },
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
        >
          <Text style={styles.title}>Scriptorium</Text>
          <Text style={styles.subtitle}>Inicia sesión para ver tu biblioteca</Text>
          <View style={styles.trialBanner} accessibilityRole="text">
            <Ionicons name="gift-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.trialBannerText}>{subscriptionCopy.trialLead}</Text>
          </View>
          {syncError ? (
            <View style={styles.syncErrorBox} accessibilityRole="alert">
              <Text style={styles.syncErrorText}>{syncError}</Text>
            </View>
          ) : null}
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
            onFocus={scrollPasswordFieldIntoView}
          />
          <AppButton label={isSubmitting ? "Entrando..." : "Entrar"} onPress={onSubmit} disabled={isSubmitting} />
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Aún no tienes cuenta?</Text>
            <Link href={"/(auth)/register" as never} style={styles.link}>
              Registrate
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
