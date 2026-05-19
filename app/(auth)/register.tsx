// Pantalla de registro (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Center,
  Heading,
  HStack,
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
import { subscriptionCopy } from "@/features/billing/subscription-copy";
import { formatFirebaseAuthError } from "@/shared/lib/firebase-auth-errors";
import { showAppAlert } from "@/shared/lib/show-app-alert";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { AppLink } from "@/shared/ui/app-link";
import { Screen } from "@/shared/ui/screen";

export default function RegisterScreen() {
  const { scrollRef, scrollPasswordFieldIntoView } = useAuthFormScroll();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const registerSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    email: z.string().trim().email("Introduce un correo valido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  });
  const { register, isAuthenticated, syncError, clearSyncError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

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
      clearSyncError();
      await register(parsed.data);
    } catch (error) {
      showAppAlert("No se pudo crear la cuenta", formatFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
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
          <VStack space="lg">
            <VStack space="xs">
              <Heading size="xl" color="$primary800">
                Crear cuenta
              </Heading>
              <Text size="sm" color="$textLight700">
                Comienza a registrar tus lecturas
              </Text>
            </VStack>

            <HStack
              space="sm"
              alignItems="flex-start"
              p="$3"
              borderRadius="$md"
              borderWidth={1}
              borderColor="$primary200"
              bg="$backgroundLight50"
            >
              <Ionicons name="gift-outline" size={22} color="#A87D42" />
              <Text flex={1} size="sm" color="$textLight900" lineHeight={21}>
                {subscriptionCopy.trialLead}
              </Text>
            </HStack>

            {syncError ? (
              <Box bg="$error100" p="$3" borderRadius="$md" borderWidth={1} borderColor="$error300">
                <Text size="sm" color="$error700">
                  {syncError}
                </Text>
              </Box>
            ) : null}

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
            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Mínimo 6 caracteres"
              error={errors.password}
              onFocus={scrollPasswordFieldIntoView}
            />

            <AppButton
              label={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              onPress={onSubmit}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            />

            <Text size="xs" color="$textLight500" textAlign="center">
              Al registrarte, aceptas los Términos de servicio y la Política de privacidad (próximamente).
            </Text>

            <Center>
              <Text size="sm" color="$textLight700">
                ¿Ya tienes cuenta?
              </Text>
              <AppLink href={"/(auth)/login" as never}>
                <Text size="sm" fontWeight="$bold" color="$primary600" mt="$1">
                  Inicia sesión
                </Text>
              </AppLink>
            </Center>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
