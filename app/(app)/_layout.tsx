import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/use-auth";
import { AppLoader } from "@/shared/ui/app-loader";
import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";
import { theme } from "@/shared/ui/theme";

export default function ProtectedLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login" as never} />;
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
        name="books/[id]"
        options={{
          title: "",
          headerShown: true,
          headerShadowVisible: false,
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
      <Stack.Screen
        name="books/new"
        options={{
          title: "",
          headerShown: true,
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
          headerShadowVisible: false,
          presentation: "modal",
          header: () => <ScriptoriumHeader showBackButton />,
        }}
      />
    </Stack>
  );
}

