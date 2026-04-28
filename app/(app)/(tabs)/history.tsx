import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { useMonthlyHistory, useReadingSessionsList } from "@/features/readingSessions/use-history";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function HistoryScreen() {
  const history = useMonthlyHistory();
  const sessionsQuery = useReadingSessionsList();
  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (history.isLoading && !history.data) {
    return <AppLoader />;
  }

  if (history.isError) {
    return (
      <Screen>
        <Text style={styles.errorText}>No se pudo cargar el historial. Comprueba tu conexion y vuelve a intentarlo.</Text>
      </Screen>
    );
  }

  const firstDay = new Date(history.selected.year, history.selected.month - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(history.selected.year, history.selected.month, 0).getDate();
  const pagesByDate = new Map((history.data?.days ?? []).map((day) => [day.date, day.pagesRead]));
  const calendarCells: { key: string; day?: number; pages?: number }[] = [];

  for (let index = 0; index < startWeekday; index += 1) {
    calendarCells.push({ key: `empty-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${history.selected.year}-${String(history.selected.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({
      key: dateKey,
      day,
      pages: pagesByDate.get(dateKey) ?? 0,
    });
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ key: `tail-${calendarCells.length}` });
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        id: string;
        title: string;
        author: string;
        pagesRead: number;
        previousPage?: number;
        currentPage: number;
        recordedAt: string;
      }>
    >();
    const sessions = sessionsQuery.data ?? [];
    for (const session of sessions) {
      const at = new Date(session.recordedAt);
      if (Number.isNaN(at.getTime())) continue;
      const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
      const row = map.get(key) ?? [];
      row.push({
        id: session.id,
        title: session.title,
        author: session.author,
        pagesRead: Math.max(0, session.pagesRead ?? 0),
        previousPage: session.previousPage,
        currentPage: session.currentPage,
        recordedAt: session.recordedAt,
      });
      map.set(key, row);
    }
    return map;
  }, [sessionsQuery.data]);

  const selectedSessions = selectedDay ? sessionsByDay.get(selectedDay) ?? [] : [];

  function intensityColor(pages = 0) {
    if (pages <= 0) return "#F3E9D7";
    if (pages <= 10) return "#E3CFA8";
    if (pages <= 25) return "#C9A36A";
    if (pages <= 40) return "#A0713F";
    return "#6B4528";
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <FlatList
        data={[{ id: "history-header-only" }]}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.monthControls}>
              <Button
                mode="outlined"
                style={styles.navBtn}
                labelStyle={styles.navBtnLabel}
                onPress={history.previousMonth}
              >
                Mes anterior
              </Button>
              <Text style={styles.monthLabel}>
                {monthFormatter.format(new Date(history.selected.year, history.selected.month - 1, 1))}
              </Text>
              <Button
                mode="outlined"
                style={styles.navBtn}
                labelStyle={styles.navBtnLabel}
                onPress={history.nextMonth}
              >
                Mes siguiente
              </Button>
            </View>
 
            <Card mode="outlined" style={styles.calendarCard}>
              <Card.Content>
              <Text variant="titleMedium" style={styles.calendarTitle}>Calendario de intensidad</Text>
              <View style={styles.weekRow}>
                {["L", "M", "X", "J", "V", "S", "D"].map((weekDay) => (
                  <Text key={weekDay} style={styles.weekDayLabel}>
                    {weekDay}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarCells.map((cell) => (
                  <Pressable
                    key={cell.key}
                    disabled={!cell.day || !cell.pages}
                    onPress={() => setSelectedDay(cell.key)}
                    style={[
                      styles.dayCell,
                      { backgroundColor: intensityColor(cell.pages) },
                      selectedDay === cell.key ? styles.dayCellSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        (cell.pages ?? 0) >= 26 ? styles.dayCellTextOnDark : null,
                      ]}
                    >
                      {cell.day ?? ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.legendRow}>
                {[
                  { label: "0", color: intensityColor(0) },
                  { label: "1-10", color: intensityColor(10) },
                  { label: "11-25", color: intensityColor(25) },
                  { label: "26-40", color: intensityColor(40) },
                  { label: "41+", color: intensityColor(50) },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
              {selectedDay ? (
                <View style={styles.sessionsBlock}>
                  <Text style={styles.sessionsTitle}>
                    Sesiones del {dateFormatter.format(new Date(selectedDay))}
                  </Text>
                  {selectedSessions.length > 0 ? (
                    selectedSessions.map((session) => (
                      <View key={session.id} style={styles.sessionMiniCard}>
                        <Text style={styles.sessionMiniTitle} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <Text style={styles.sessionMiniMeta} numberOfLines={1}>
                          {session.author || "Autor desconocido"}
                        </Text>
                        <Text style={styles.sessionMiniMeta}>
                          Paginas: {Math.max(0, (session.previousPage ?? session.currentPage - session.pagesRead) + 1)} - {session.currentPage}
                        </Text>
                        <Text style={styles.sessionMiniMeta}>
                          Hora: {timeFormatter.format(new Date(session.recordedAt))}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sessionEmptyText}>No hay detalle de sesiones para ese día.</Text>
                  )}
                </View>
              ) : null}
              </Card.Content>
            </Card>
          </View>
        }
        ListEmptyComponent={null}
        renderItem={() => null}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 10,
  },
  headerContainer: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  monthControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  navBtn: {
    flex: 1,
  },
  navBtnLabel: {
    fontSize: 12,
  },
  monthLabel: {
    fontWeight: "700",
    color: theme.colors.textOnDark,
    minWidth: 72,
    textAlign: "center",
    textTransform: "capitalize",
  },
  calendarCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  calendarTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekDayLabel: {
    width: "14%",
    textAlign: "center",
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  dayCellText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "600",
  },
  dayCellTextOnDark: {
    color: theme.colors.textOnDark,
  },
  errorText: {
    color: theme.colors.textOnDark,
  },
  legendText: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  legendRow: {
    marginTop: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sessionsBlock: {
    marginTop: 12,
    gap: 8,
  },
  sessionsTitle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  sessionMiniCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sessionMiniTitle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  sessionMiniMeta: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  sessionEmptyText: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
});

