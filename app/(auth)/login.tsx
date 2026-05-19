// Pantalla de inicio de sesion con validacion de formulario (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonText,
  Center,
  Divider,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Heading,
  HStack,
  Image,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useAuthFormScroll } from "@/features/auth/use-auth-form-scroll";
import { useAuth } from "@/features/auth/use-auth";
import { formatFirebaseAuthError } from "@/shared/lib/firebase-auth-errors";
import { showAppAlert } from "@/shared/lib/show-app-alert";
import { showPlaceholderAlert } from "@/shared/ui/placeholder-alerts";
import { AppLink } from "@/shared/ui/app-link";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { Screen } from "@/shared/ui/screen";

const logo = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const { scrollRef, scrollPasswordFieldIntoView } = useAuthFormScroll();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

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

  return (
    <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VStack space="lg" flex={1}>
            <Center>
              <Image source={logo} alt="Scriptorium" width={100} height={100} resizeMode="contain" />
              <Heading size="xl" color="$primary800" mt="$2" textAlign="center">
                SCRIPTORIUM
              </Heading>
              <Text size="sm" color="$textLight700" textAlign="center" mt="$1">
                Tu biblioteca personal, siempre contigo.
              </Text>
            </Center>

            {syncError ? (
              <Box bg="$error100" p="$3" borderRadius="$md" borderWidth={1} borderColor="$error300">
                <Text size="sm" color="$error700">
                  {syncError}
                </Text>
              </Box>
            ) : null}

            <AppInput
              label="Correo electrónico"
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

            <FormControl isInvalid={Boolean(errors.password)}>
              <FormControlLabel mb="$1">
                <FormControlLabelText size="sm" color="$textLight900">
                  Contraseña
                </FormControlLabelText>
              </FormControlLabel>
              <Input size="lg" variant="outline" borderRadius="$lg" bg="$backgroundLight50">
                <InputField
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="Ingresa tu contraseña"
                  onFocus={scrollPasswordFieldIntoView}
                  color="$textLight900"
                />
                <InputSlot pr="$3" onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#7A6555"
                  />
                </InputSlot>
              </Input>
              {errors.password ? (
                <FormControlError mt="$1">
                  <FormControlErrorText size="xs">{errors.password}</FormControlErrorText>
                </FormControlError>
              ) : null}
            </FormControl>

            <Pressable alignSelf="flex-end" onPress={onForgotPassword}>
              <Text size="sm" color="$primary600">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            <AppButton
              label={isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
              onPress={onSubmit}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            />

            <HStack alignItems="center" space="md">
              <Divider flex={1} />
              <Text size="sm" color="$textLight500">
                o continúa con
              </Text>
              <Divider flex={1} />
            </HStack>

            <VStack space="sm">
              <Button size="lg" variant="outline" action="secondary" onPress={() => onSocialLogin("Google")}>
                <HStack space="sm" alignItems="center">
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <ButtonText>Google</ButtonText>
                </HStack>
              </Button>
              <Button size="lg" variant="outline" action="secondary" onPress={() => onSocialLogin("Apple")}>
                <HStack space="sm" alignItems="center">
                  <Ionicons name="logo-apple" size={20} color="#2D1F15" />
                  <ButtonText>Apple</ButtonText>
                </HStack>
              </Button>
            </VStack>

            <Center mt="$2">
              <Text size="sm" color="$textLight700">
                ¿No tienes cuenta?
              </Text>
              <AppLink href={"/(auth)/register" as never}>
                <Text size="sm" fontWeight="$bold" color="$primary600" mt="$1">
                  Crea una aquí
                </Text>
              </AppLink>
            </Center>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
