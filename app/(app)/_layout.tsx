// Controla el acceso autenticado y la estructura privada de navegacion.
import { Redirect, Stack, useSegments } from "expo-router";
import { Platform } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { useBillingStatus } from "@/features/billing/use-billing";
import { AppLoader } from "@/shared/ui/app-loader";
import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";
import { theme } from "@/shared/ui/theme";

export default function ProtectedLayout() {
  const { isAuthenticated, isBootstrapping, token } = useAuth();
  const billing = useBillingStatus();
  const segments = useSegments();

  if (isBootstrapping) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login" as never} />;
  }

  const billingCanFetch = Boolean(token?.trim());
  if (
    billingCanFetch &&
    billing.status !== "success" &&
    billing.status !== "error"
  ) {
    return <AppLoader />;
  }

  const billingAllowsApp =
    billing.status !== "success" ||
    !billing.data?.needsPayment ||
    segments.includes("upgrade") ||
    segments.includes("profile");

  if (!billingAllowsApp) {
    return <Redirect href="/upgrade" />;
  }

  const nativeStackHeader = {
    headerStyle: { backgroundColor: theme.colors.bgSoft },
    headerTintColor: theme.colors.primary,
    headerTitleStyle: {
      color: theme.colors.text,
      fontFamily: "Fraunces_700Bold",
      fontSize: 18,
    },
    headerShadowVisible: false,
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.textOnDark,
        headerTitleStyle: {
          color: theme.colors.textOnDark,
          fontFamily: "Fraunces_700Bold",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="upgrade"
        options={
          Platform.OS === "web"
            ? {
                title: "",
                headerShown: true,
                headerTransparent: false,
                headerShadowVisible: false,
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...nativeStackHeader,
                title: "Scriptorium Pro",
                headerShown: true,
              }
        }
      />
      <Stack.Screen
        name="profile"
        options={
          Platform.OS === "web"
            ? {
                headerShown: false,
                presentation: "modal",
                animation: "slide_from_bottom",
              }
            : {
                ...nativeStackHeader,
                title: "Perfil",
                headerShown: true,
                presentation: "card",
              }
        }
      />
      <Stack.Screen
        name="app-menu"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          ...nativeStackHeader,
          title: "Ajustes",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="activity"
        options={{
          ...nativeStackHeader,
          title: "Actividad de compras",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="library-filters"
        options={{
          ...nativeStackHeader,
          title: "Filtrar",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="wishlist-filters"
        options={{
          ...nativeStackHeader,
          title: "Filtrar",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="books/[id]"
        options={
          Platform.OS === "web"
            ? {
                title: "",
                headerShown: true,
                headerTransparent: false,
                headerShadowVisible: false,
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...nativeStackHeader,
                title: "Libro",
                headerShown: true,
              }
        }
      />
      <Stack.Screen
        name="books/new"
        options={
          Platform.OS === "web"
            ? {
                title: "",
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                presentation: "modal",
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...nativeStackHeader,
                title: "Añadir libro",
                headerShown: true,
                presentation: "modal",
              }
        }
      />
      <Stack.Screen
        name="books/edit"
        options={
          Platform.OS === "web"
            ? {
                title: "",
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                presentation: "modal",
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...nativeStackHeader,
                title: "Editar libro",
                headerShown: true,
                presentation: "modal",
              }
        }
      />
    </Stack>
  );
}

