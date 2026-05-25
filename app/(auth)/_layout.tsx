// Agrupa y configura la navegacion del flujo de autenticacion.
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerLargeTitle: false,
        ...(Platform.OS === "web"
          ? {
              // Evita pantallas inactivas con aria-hidden que roban foco y bloquean clics en web.
              detachInactiveScreens: false,
            }
          : {}),
      }}
    >
      <Stack.Screen name="login" options={{ title: "Iniciar sesión" }} />
      <Stack.Screen name="register" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}

