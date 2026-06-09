// Controla el acceso autenticado y la estructura privada de navegacion.
import { Redirect, Stack, useSegments } from "expo-router";
import { Platform } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { DailyReminderBootstrap } from "@/features/notifications/daily-reminder-bootstrap";
import { PushNotificationsBootstrap } from "@/features/notifications/push-notifications-bootstrap";
import { SubscriptionRequiredBootstrap } from "@/features/billing/subscription-required-bootstrap";
import { useBillingStatus } from "@/features/billing/use-billing";
import { APP_CREAM_BG, scriptoriumNativeHeader } from "@/shared/ui/app-colors";
import { AppLoader } from "@/shared/ui/app-loader";
import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";

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
    <>
      <SubscriptionRequiredBootstrap />
      <PushNotificationsBootstrap />
      <DailyReminderBootstrap />
      <Stack screenOptions={scriptoriumNativeHeader}>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: "" }}
      />
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
                ...scriptoriumNativeHeader,
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
                presentation: "card",
              }
            : {
                ...scriptoriumNativeHeader,
                title: "Perfil",
                headerShown: true,
                presentation: "card",
                contentStyle: { backgroundColor: APP_CREAM_BG },
              }
        }
      />
      <Stack.Screen
        name="app-menu"
        options={{
          headerShown: false,
          title: "",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          ...scriptoriumNativeHeader,
          title: "Notificaciones",
          headerShown: true,
          contentStyle: { backgroundColor: APP_CREAM_BG },
        }}
      />
      <Stack.Screen
        name="activity"
        options={{
          ...scriptoriumNativeHeader,
          title: "Actividad de compras",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="library-filters"
        options={{
          ...scriptoriumNativeHeader,
          title: "Filtrar",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="wishlist-filters"
        options={{
          ...scriptoriumNativeHeader,
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
                ...scriptoriumNativeHeader,
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
                presentation: "card",
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...scriptoriumNativeHeader,
                title: "Añadir libro",
                headerShown: true,
                presentation: "card",
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
                presentation: "card",
                header: () => <ScriptoriumHeader showBackButton />,
              }
            : {
                ...scriptoriumNativeHeader,
                title: "Editar libro",
                headerShown: true,
                presentation: "card",
              }
        }
      />
      <Stack.Screen
        name="books/mark-page"
        options={{ ...scriptoriumNativeHeader, title: "Marcar página", headerShown: true }}
      />
      <Stack.Screen
        name="books/review"
        options={{ ...scriptoriumNativeHeader, title: "Mi reseña", headerShown: true }}
      />
      <Stack.Screen
        name="books/status"
        options={{ ...scriptoriumNativeHeader, title: "Estado", headerShown: true }}
      />
      <Stack.Screen
        name="books/times-read"
        options={{ ...scriptoriumNativeHeader, title: "Veces leído", headerShown: true }}
      />
      <Stack.Screen
        name="books/delete-book"
        options={{ ...scriptoriumNativeHeader, title: "Eliminar libro", headerShown: true }}
      />
      <Stack.Screen
        name="history/delete-session"
        options={{ ...scriptoriumNativeHeader, title: "Eliminar sesión", headerShown: true }}
      />
      <Stack.Screen
        name="wishlist/item-form"
        options={{ ...scriptoriumNativeHeader, title: "Deseo", headerShown: true }}
      />
      <Stack.Screen
        name="wishlist/confirm"
        options={{ ...scriptoriumNativeHeader, title: "Confirmar", headerShown: true }}
      />
      <Stack.Screen
        name="upgrade/checkout"
        options={{ ...scriptoriumNativeHeader, title: "Pago Pro", headerShown: true }}
      />
      </Stack>
    </>
  );
}

