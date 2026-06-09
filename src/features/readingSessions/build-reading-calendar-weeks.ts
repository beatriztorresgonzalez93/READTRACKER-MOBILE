export type ReadingCalendarCell = { key: string; day?: number; pages?: number };

export function buildReadingCalendarWeeks(
  year: number,
  month: number,
  pagesByDate: Map<string, number>,
): ReadingCalendarCell[][] {
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarCells: ReadingCalendarCell[] = [];

  for (let index = 0; index < startWeekday; index += 1) {
    calendarCells.push({ key: `empty-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({
      key: dateKey,
      day,
      pages: pagesByDate.get(dateKey) ?? 0,
    });
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ key: `tail-${calendarCells.length}` });
  }

  const calendarWeeks: ReadingCalendarCell[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    calendarWeeks.push(calendarCells.slice(i, i + 7));
  }

  return calendarWeeks;
}
