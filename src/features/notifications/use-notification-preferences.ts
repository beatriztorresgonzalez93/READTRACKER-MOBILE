import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/shared/api/notifications-api";
import { canRegisterRemotePush } from "@/shared/notifications/push-capabilities";

export function useNotificationPreferences() {
  const { token, isAuthenticated } = useAuth();
  const [pushEngagementEnabled, setPushEngagementEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(Platform.OS !== "web");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token?.trim() || Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const prefs = await getNotificationPreferences(token);
        if (!cancelled) setPushEngagementEnabled(prefs.pushEngagementEnabled);
      } catch {
        /* preferencias por defecto */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const togglePushEngagement = useCallback(async () => {
    if (!token?.trim() || Platform.OS === "web" || isSaving) return;
    const next = !pushEngagementEnabled;
    setPushEngagementEnabled(next);
    setIsSaving(true);
    try {
      const prefs = await updateNotificationPreferences(token, next);
      setPushEngagementEnabled(prefs.pushEngagementEnabled);
    } catch {
      setPushEngagementEnabled(!next);
    } finally {
      setIsSaving(false);
    }
  }, [token, pushEngagementEnabled, isSaving]);

  return {
    pushEngagementEnabled,
    isLoading,
    isSaving,
    togglePushEngagement,
    supportsPush: canRegisterRemotePush(),
    isExpoGo: Platform.OS !== "web" && !canRegisterRemotePush(),
  };
}
