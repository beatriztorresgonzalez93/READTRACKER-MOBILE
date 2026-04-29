// Construye historial y resumenes agregando sesiones de lectura.
import { getReadingSessions } from "@/shared/api/reading-sessions-api";
import type { MonthlyHistory, ReadingStats } from "@/shared/types/history";
import type { ReadingSession } from "@/shared/types/reading-session";

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthlyHistoryFromSessions(sessions: ReadingSession[], year: number, month: number): MonthlyHistory {
  const byDay = new Map<string, { sessionsCount: number; pagesRead: number }>();

  sessions.forEach((session) => {
    const at = new Date(session.recordedAt);
    if (Number.isNaN(at.getTime())) return;
    if (at.getFullYear() !== year || at.getMonth() + 1 !== month) return;
    const key = toDayKey(at);
    const current = byDay.get(key) ?? { sessionsCount: 0, pagesRead: 0 };
    current.sessionsCount += 1;
    current.pagesRead += Math.max(0, session.pagesRead ?? 0);
    byDay.set(key, current);
  });

  const days = Array.from(byDay.entries())
    .map(([date, data]) => ({
      date,
      sessionsCount: data.sessionsCount,
      totalMinutes: 0,
      pagesRead: data.pagesRead,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    year,
    month,
    totalSessions: days.reduce((acc, day) => acc + day.sessionsCount, 0),
    totalMinutes: 0,
    totalPages: days.reduce((acc, day) => acc + day.pagesRead, 0),
    days,
  };
}

export async function getMonthlyHistory(token: string, year: number, month: number): Promise<MonthlyHistory> {
  const sessions = await getReadingSessions(token);
  return buildMonthlyHistoryFromSessions(sessions, year, month);
}

export async function getReadingStats(token: string): Promise<ReadingStats> {
  const sessions = await getReadingSessions(token);
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearlySessions = sessions.filter((session) => {
    const at = new Date(session.recordedAt);
    return !Number.isNaN(at.getTime()) && at.getFullYear() === currentYear;
  });

  const yearlyPages = yearlySessions.reduce((acc, s) => acc + Math.max(0, s.pagesRead ?? 0), 0);

  const uniqueDays = Array.from(
    new Set(
      sessions
        .map((session) => new Date(session.recordedAt))
        .filter((d) => !Number.isNaN(d.getTime()))
        .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()),
    ),
  ).sort((a, b) => a - b);

  let bestStreak = 0;
  let currentStreak = 0;
  let running = 0;

  for (let index = 0; index < uniqueDays.length; index += 1) {
    if (index === 0 || uniqueDays[index] - uniqueDays[index - 1] === 86_400_000) {
      running += 1;
    } else {
      running = 1;
    }
    bestStreak = Math.max(bestStreak, running);
  }

  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let cursor = uniqueDays.length - 1;
  let expected = todayKey;
  while (cursor >= 0 && uniqueDays[cursor] === expected) {
    currentStreak += 1;
    expected -= 86_400_000;
    cursor -= 1;
  }

  return {
    currentStreak,
    bestStreak,
    yearlyPages,
    yearlySessions: yearlySessions.length,
    averageMinutesPerSession: 0,
  };
}

