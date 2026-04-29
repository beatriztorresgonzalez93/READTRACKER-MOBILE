// Tipos para historial mensual y estadisticas de lectura.
export type HistoryDay = {
  date: string;
  sessionsCount: number;
  totalMinutes: number;
  pagesRead: number;
};

export type MonthlyHistory = {
  year: number;
  month: number;
  totalSessions: number;
  totalMinutes: number;
  totalPages: number;
  days: HistoryDay[];
};

export type ReadingStats = {
  currentStreak: number;
  bestStreak: number;
  yearlyPages: number;
  yearlySessions: number;
  averageMinutesPerSession: number;
};

