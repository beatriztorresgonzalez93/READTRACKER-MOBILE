// Hooks para construir historial mensual y estadisticas de lectura.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import { getMonthlyHistory, getReadingStats } from "@/shared/api/history-api";
import { getReadingSessions } from "@/shared/api/reading-sessions-api";

function getTodayMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function useMonthlyHistory() {
  const { token } = useAuth();
  const [selected, setSelected] = useState(getTodayMonth());

  const query = useQuery({
    queryKey: ["history", "monthly", selected.year, selected.month],
    queryFn: () => getMonthlyHistory(token ?? "", selected.year, selected.month),
    enabled: Boolean(token),
  });

  const label = useMemo(() => `${selected.month.toString().padStart(2, "0")}/${selected.year}`, [selected]);

  function previousMonth() {
    setSelected((current) => {
      const isJanuary = current.month === 1;
      return {
        month: isJanuary ? 12 : current.month - 1,
        year: isJanuary ? current.year - 1 : current.year,
      };
    });
  }

  function nextMonth() {
    setSelected((current) => {
      const isDecember = current.month === 12;
      return {
        month: isDecember ? 1 : current.month + 1,
        year: isDecember ? current.year + 1 : current.year,
      };
    });
  }

  return { ...query, selected, label, previousMonth, nextMonth };
}

export function useReadingStats() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["stats", "reading"],
    queryFn: () => getReadingStats(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useReadingSessionsList() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["reading-sessions", "list"],
    queryFn: () => getReadingSessions(token ?? ""),
    enabled: Boolean(token),
  });
}

