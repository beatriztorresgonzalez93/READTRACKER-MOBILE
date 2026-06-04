import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { ANDROID_CHANNEL_ID } from "@/shared/notifications/setup-notifications";

const NOTIFICATION_ID_KEY = "readtracker_daily_reminder_notification_id";
/** Solo "true" si el usuario desactivó el recordatorio en Ajustes. */
const OPTED_OUT_KEY = "readtracker_daily_reminder_opted_out";

export const DAILY_READING_REMINDER_HOUR = 20;
export const DAILY_READING_REMINDER_MINUTE = 0;

const REMINDER_TITLE = "ReadTracker";
const REMINDER_BODY = "¿Te apetece leer? Abre tu biblioteca y sigue donde lo dejaste.";

export function supportsLocalNotifications(): boolean {
  return Platform.OS !== "web";
}

export async function hasUserOptedOutOfDailyReminder(): Promise<boolean> {
  return (await AsyncStorage.getItem(OPTED_OUT_KEY)) === "true";
}

async function setOptedOut(optedOut: boolean): Promise<void> {
  if (optedOut) {
    await AsyncStorage.setItem(OPTED_OUT_KEY, "true");
  } else {
    await AsyncStorage.removeItem(OPTED_OUT_KEY);
  }
}

/** Programa aviso local todos los días a las 20:00 (hora del dispositivo). */
export async function enableDailyReadingReminder(
  hour = DAILY_READING_REMINDER_HOUR,
  minute = DAILY_READING_REMINDER_MINUTE,
): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return false;

  const storedId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId).catch(() => undefined);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  await setOptedOut(false);
  return true;
}

export async function disableDailyReadingReminder(): Promise<void> {
  if (!supportsLocalNotifications()) return;

  const storedId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId).catch(() => undefined);
  }

  await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
  await setOptedOut(true);
}

/** Activo = permiso concedido y el usuario no lo desactivó en Ajustes. */
export async function isDailyReadingReminderEnabled(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;
  if (await hasUserOptedOutOfDailyReminder()) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Al iniciar sesión: pide permiso si hace falta y programa las 20:00 automáticamente.
 * No hace falta marcar la casilla en Ajustes.
 */
export async function ensureAutoDailyReadingReminder(): Promise<void> {
  if (!supportsLocalNotifications()) return;
  if (await hasUserOptedOutOfDailyReminder()) return;

  let { status } = await Notifications.getPermissionsAsync();

  if (status === "undetermined") {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }

  if (status !== "granted") return;

  await enableDailyReadingReminder();
}

/** @deprecated Usar ensureAutoDailyReadingReminder */
export async function syncDailyReadingReminderOnLaunch(): Promise<void> {
  await ensureAutoDailyReadingReminder();
}
