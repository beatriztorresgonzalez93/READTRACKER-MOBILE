import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { env } from "@/shared/config/env";
import {
  registerPushToken,
  touchNotificationActivity,
  unregisterPushToken,
} from "@/shared/api/notifications-api";
import { canRegisterRemotePush, isExpoGoClient } from "@/shared/notifications/push-capabilities";

function resolveExpoProjectId(): string | null {
  const fromEnv = env.easProjectId.trim();
  if (fromEnv) return fromEnv;
  const fromConfig =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? "";
  return typeof fromConfig === "string" && fromConfig.trim() ? fromConfig.trim() : null;
}

async function obtainExpoPushToken(): Promise<string | null> {
  if (!canRegisterRemotePush()) {
    if (__DEV__ && isExpoGoClient()) {
      console.warn(
        "[push] Push remotas no disponibles en Expo Go (SDK 53+). Usa un development build: npx expo run:android",
      );
    }
    return null;
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.warn(
      "[push] Falta EXPO_PUBLIC_EAS_PROJECT_ID. Crea un proyecto en https://expo.dev y añade el ID al .env",
    );
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

/** Registra el dispositivo para push de re-engagement y actualiza actividad al volver a la app. */
export function usePushNotifications() {
  const { token, isAuthenticated } = useAuth();
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token?.trim() || Platform.OS === "web") return;

    let cancelled = false;

    void (async () => {
      try {
        const expoPushToken = await obtainExpoPushToken();
        if (!expoPushToken || cancelled) return;
        pushTokenRef.current = expoPushToken;
        await registerPushToken(token, {
          expoPushToken,
          platform: Platform.OS,
        });
      } catch (error) {
        console.warn("[push] No se pudo registrar el token:", error);
      }
    })();

    return () => {
      cancelled = true;
      const expoPushToken = pushTokenRef.current;
      pushTokenRef.current = null;
      if (expoPushToken && token?.trim()) {
        void unregisterPushToken(token, expoPushToken).catch(() => undefined);
      }
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token?.trim() || Platform.OS === "web") return;

    const touch = () => {
      void touchNotificationActivity(token).catch(() => undefined);
    };

    touch();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") touch();
    });

    return () => subscription.remove();
  }, [isAuthenticated, token]);
}
