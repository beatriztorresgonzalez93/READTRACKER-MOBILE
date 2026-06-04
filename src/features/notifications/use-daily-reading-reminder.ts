import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import {
  DAILY_READING_REMINDER_HOUR,
  disableDailyReadingReminder,
  enableDailyReadingReminder,
  isDailyReadingReminderEnabled,
  supportsLocalNotifications,
} from "@/shared/notifications/daily-reading-reminder";

export function useDailyReadingReminder() {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(Platform.OS !== "web");
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    const on = await isDailyReadingReminderEnabled();
    setEnabled(on);
  }, []);

  useEffect(() => {
    if (!supportsLocalNotifications()) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!supportsLocalNotifications() || isSaving) return;

    const next = !enabled;
    setIsSaving(true);

    try {
      if (next) {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (existing === "undetermined") {
          const result = await Notifications.requestPermissionsAsync();
          status = result.status;
        }
        if (status !== "granted") {
          Alert.alert(
            "Permiso necesario",
            "Activa las notificaciones en los ajustes del sistema para recibir el recordatorio diario a las 20:00.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
            ],
          );
          return;
        }
        const ok = await enableDailyReadingReminder();
        if (ok) setEnabled(true);
      } else {
        await disableDailyReadingReminder();
        setEnabled(false);
      }
    } finally {
      setIsSaving(false);
    }
  }, [enabled, isSaving]);

  return {
    enabled,
    isLoading,
    isSaving,
    toggle,
    supportsLocal: supportsLocalNotifications(),
    hour: DAILY_READING_REMINDER_HOUR,
  };
}
