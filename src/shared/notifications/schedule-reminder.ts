import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { ANDROID_CHANNEL_ID } from "@/shared/notifications/setup-notifications";

/** Programa un recordatorio local en la fecha indicada. Devuelve el id o null si no hay permiso. */
export async function scheduleReminder(title: string, date: Date): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (date.getTime() <= Date.now()) return null;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio de ReadTracker",
      body: title,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}
