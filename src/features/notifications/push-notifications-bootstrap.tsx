import { usePushNotifications } from "@/features/notifications/use-push-notifications";

/** Sin UI: registra push y actividad cuando hay sesión (solo móvil). */
export function PushNotificationsBootstrap() {
  usePushNotifications();
  return null;
}
