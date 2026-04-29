export function calculateCompletion(currentPage: number, totalPages: number): number {
  if (!Number.isFinite(totalPages) || totalPages <= 0) return 0;
  const raw = Math.round((Math.max(0, currentPage) / totalPages) * 100);
  return Math.max(0, Math.min(100, raw));
}

export function parseNextPageInput(raw: string, totalPages: number): number | null {
  const next = Number(raw);
  if (!Number.isFinite(next)) return null;
  const rounded = Math.round(next);
  if (rounded < 1 || rounded > totalPages) return null;
  return rounded;
}

export function buildReadingSessionPayload(nextPage: number, currentPage: number) {
  return {
    currentPage: Math.round(nextPage),
    previousPage: Math.max(0, currentPage),
  };
}
