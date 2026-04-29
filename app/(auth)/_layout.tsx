// Agrupa y configura la navegacion del flujo de autenticacion.
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Iniciar sesion" }} />
      <Stack.Screen name="register" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}

