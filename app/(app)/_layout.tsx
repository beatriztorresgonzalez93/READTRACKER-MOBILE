// Controla el acceso autenticado y la estructura privada de navegacion.
import { Redirect, Stack, useSegments } from "expo-router";

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
        options={{
          title: "",
          headerShown: true,
          headerTransparent: false,
          headerShadowVisible: false,
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="books/[id]"
        options={{
          title: "",
          headerShown: true,
          headerTransparent: false,
          headerShadowVisible: false,
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
      <Stack.Screen
        name="books/new"
        options={{
          title: "",
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          presentation: "modal",
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
      <Stack.Screen
        name="books/edit"
        options={{
          title: "",
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          presentation: "modal",
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
    </Stack>
  );
}

