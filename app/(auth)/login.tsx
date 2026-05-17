// Pantalla de inicio de sesion con validacion de formulario.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useAuthFormScroll } from "@/features/auth/use-auth-form-scroll";
import { useAuth } from "@/features/auth/use-auth";
import { formatFirebaseAuthError } from "@/shared/lib/firebase-auth-errors";
import { showAppAlert } from "@/shared/lib/show-app-alert";
import { showPlaceholderAlert } from "@/shared/ui/placeholder-alerts";
import { AppLink } from "@/shared/ui/app-link";
import { Screen } from "@/shared/ui/screen";
import { useAppTheme } from "@/shared/ui/use-app-theme";

const logo = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const { scrollRef, scrollPasswordFieldIntoView } = useAuthFormScroll();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const loginSchema = z.object({
    email: z.string().trim().email("Introduce un correo valido."),
    password: z.string().min(1, "La contraseña es obligatoria."),
  });
  const { login, isAuthenticated, syncError, clearSyncError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        requestAnimationFrame(() => {
          (document.activeElement as HTMLElement | null)?.blur?.();
        });
      }
    }, []),
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

  function onForgotPassword() {
    showPlaceholderAlert(
      "Próximamente",
      "La recuperación de contraseña estará disponible en una próxima versión.",
    );
  }

  const styles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingTop: insets.top + 12,
      paddingBottom: Math.max(insets.bottom, 24) + 24,
      gap: 20,
    },
    brandBlock: {
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    logo: {
      width: 120,
      height: 120,
    },
    brandName: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 28,
      letterSpacing: 2,
      color: theme.colors.textOnDark,
      textTransform: "uppercase",
    },
    tagline: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 15,
      color: theme.colors.textMutedOnDark,
      textAlign: "center",
      lineHeight: 22,
    },
    syncErrorBox: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.bgSoft,
    },
    syncErrorText: {
      color: theme.colors.textOnDark,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "Fraunces_400Regular",
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 14,
      color: theme.colors.textOnDark,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.borderOnCard,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    inputRowError: {
      borderColor: theme.colors.danger,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontFamily: "Fraunces_400Regular",
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    fieldError: {
      color: theme.colors.danger,
      fontSize: 12,
      fontFamily: "Fraunces_400Regular",
    },
    forgotPassword: {
      alignSelf: "flex-end",
      marginTop: -8,
    },
    forgotPasswordText: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 13,
      color: theme.colors.textMutedOnDark,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonLabel: {
      color: theme.colors.onPrimary,
      fontFamily: "Fraunces_700Bold",
      fontSize: 16,
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
      backgroundColor: theme.colors.borderOnCard,
    },
    dividerText: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 13,
      color: theme.colors.textMutedOnDark,
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderOnCard,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      paddingVertical: 13,
    },
    socialButtonLabel: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 15,
      color: theme.colors.textOnDark,
    },
    registerBlock: {
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    registerHint: {
      fontFamily: "Fraunces_400Regular",
      fontSize: 14,
      color: theme.colors.textMutedOnDark,
    },
    registerLink: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 15,
      color: theme.colors.primary,
    },
  });

  return (
    <Screen backgroundColor={theme.colors.bg} webBackgroundColor={theme.colors.bg}>
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
          <View style={styles.brandBlock}>
            <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Scriptorium" />
            <Text style={styles.brandName}>Scriptorium</Text>
            <Text style={styles.tagline}>Tu biblioteca personal, siempre contigo.</Text>
          </View>

          {syncError ? (
            <View style={styles.syncErrorBox} accessibilityRole="alert">
              <Text style={styles.syncErrorText}>{syncError}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <View style={[styles.inputRow, errors.email ? styles.inputRowError : undefined]}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.textMutedOnDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.textSoft}
              />
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={[styles.inputRow, errors.password ? styles.inputRowError : undefined]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMutedOnDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={theme.colors.textSoft}
                onFocus={scrollPasswordFieldIntoView}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={8}
                accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.colors.textMutedOnDark}
                />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          <Pressable onPress={onForgotPassword} style={styles.forgotPassword} hitSlop={8}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.socialButton} onPress={() => onSocialLogin("Google")}>
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={styles.socialButtonLabel}>Google</Text>
          </Pressable>

          <Pressable style={styles.socialButton} onPress={() => onSocialLogin("Apple")}>
            <Ionicons name="logo-apple" size={20} color={theme.colors.textOnDark} />
            <Text style={styles.socialButtonLabel}>Apple</Text>
          </Pressable>

          <View style={styles.registerBlock}>
            <Text style={styles.registerHint}>¿No tienes cuenta?</Text>
            <AppLink href={"/(auth)/register" as never}>
              <Text style={styles.registerLink}>Crea una aquí</Text>
            </AppLink>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
