import { useMemo } from "react";

import type { ReadingSession } from "@/shared/types/reading-session";

export type HistorySessionByDay = {
  id: string;
  title: string;
  author: string;
  bookId: string;
  pagesRead: number;
  previousPage?: number;
  currentPage: number;
  recordedAt: string;
};

export function useHistorySessionsByDay(sessions: ReadingSession[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, HistorySessionByDay[]>();
    for (const session of sessions ?? []) {
      const at = new Date(session.recordedAt);
      if (Number.isNaN(at.getTime())) continue;
      const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
      const row = map.get(key) ?? [];
      row.push({
        id: session.id,
        title: session.title,
        author: session.author,
        bookId: session.bookId,
        pagesRead: Math.max(0, session.pagesRead ?? 0),
        previousPage: session.previousPage,
        currentPage: session.currentPage,
        recordedAt: session.recordedAt,
      });
      map.set(key, row);
    }
    return map;
  }, [sessions]);
}
