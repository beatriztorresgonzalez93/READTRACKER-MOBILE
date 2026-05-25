// Pantalla de inicio de sesion con validacion de formulario.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { useAuthFormScroll } from "@/features/auth/use-auth-form-scroll";
import { useAuth } from "@/features/auth/use-auth";
import { formatFirebaseAuthError } from "@/shared/lib/firebase-auth-errors";
import { showAppAlert } from "@/shared/lib/show-app-alert";
import { showPlaceholderAlert } from "@/shared/ui/placeholder-alerts";
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
      router.replace("/(app)/(tabs)/home" as never);
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

  function onSocialLogin(provider: "Google" | "Apple") {
    showPlaceholderAlert(
      "Próximamente",
      `El inicio de sesión con ${provider} estará disponible en una próxima versión.`,
    );
  }

  const styles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
      gap: 12,
      paddingTop: 0,
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
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      color: theme.colors.textMutedOnDark,
      fontSize: 14,
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: "transparent",
    },
    socialButtonPressed: {
      opacity: 0.9,
    },
    socialButtonLabel: {
      color: theme.colors.textOnDark,
      fontFamily: "Fraunces_700Bold",
      fontSize: 16,
    },
  });

  return (
    <Screen edges={["bottom", "left", "right"]} style={{ paddingTop: 4 }}>
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
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
            onPress={() => onSocialLogin("Google")}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
          >
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={styles.socialButtonLabel}>Google</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
            onPress={() => onSocialLogin("Apple")}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Apple"
          >
            <Ionicons name="logo-apple" size={20} color={theme.colors.textOnDark} />
            <Text style={styles.socialButtonLabel}>Apple</Text>
          </Pressable>
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
