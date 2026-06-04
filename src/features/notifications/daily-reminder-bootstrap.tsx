import { useEffect } from "react";

import { useAuth } from "@/features/auth/use-auth";
import { ensureAutoDailyReadingReminder } from "@/shared/notifications/daily-reading-reminder";

/** Tras login: pide notificaciones (si hace falta) y programa el recordatorio diario a las 20:00. */
export function DailyReminderBootstrap() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    void ensureAutoDailyReadingReminder();
  }, [isAuthenticated]);

  return null;
}
