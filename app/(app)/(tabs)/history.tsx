import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { useMonthlyHistory } from "@/features/readingSessions/use-history";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

export default function HistoryScreen() {
  const history = useMonthlyHistory();
  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (history.isLoading && !history.data) {
    return <AppLoader />;
  }

  if (history.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se pudo cargar el historial"
          description="Comprueba tu conexion y vuelve a intentarlo."
        />
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

  function intensityColor(pages = 0) {
    if (pages <= 0) return "#F1F5F9";
    if (pages <= 10) return "#DBEAFE";
    if (pages <= 25) return "#93C5FD";
    if (pages <= 40) return "#60A5FA";
    return "#2563EB";
  }

  return (
    <Screen>
      <FlatList
        data={history.data?.days ?? []}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.monthControls}>
              <Button mode="outlined" style={styles.navBtn} onPress={history.previousMonth}>
                Mes anterior
              </Button>
              <Text style={styles.monthLabel}>
                {monthFormatter.format(new Date(history.selected.year, history.selected.month - 1, 1))}
              </Text>
              <Button mode="outlined" style={styles.navBtn} onPress={history.nextMonth}>
                Mes siguiente
              </Button>
            </View>

            <Card mode="outlined" style={styles.summary}>
              <Card.Content>
                <Text style={styles.summaryText}>Sesiones: {history.data?.totalSessions ?? 0}</Text>
                <Text style={styles.summaryText}>Minutos: {history.data?.totalMinutes ?? 0}</Text>
                <Text style={styles.summaryText}>Paginas: {history.data?.totalPages ?? 0}</Text>
              </Card.Content>
            </Card>

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
                  <View key={cell.key} style={[styles.dayCell, { backgroundColor: intensityColor(cell.pages) }]}>
                    <Text style={styles.dayCellText}>{cell.day ?? ""}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.legendText}>0, 1-10, 11-25, 26-40, 41+ paginas</Text>
              </Card.Content>
            </Card>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Sin actividad este mes" description="Registra sesiones para ver tu historial diario." />}
        renderItem={({ item }) => (
          <Card mode="outlined" style={styles.dayCard}>
            <Card.Content>
              <Text style={styles.dayDate}>{dateFormatter.format(new Date(item.date))}</Text>
              <Text style={styles.dayMeta}>Sesiones: {item.sessionsCount}</Text>
              <Text style={styles.dayMeta}>Minutos: {item.totalMinutes}</Text>
              <Text style={styles.dayMeta}>Paginas: {item.pagesRead}</Text>
            </Card.Content>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  monthLabel: {
    fontWeight: "700",
    color: theme.colors.text,
    minWidth: 72,
    textAlign: "center",
    textTransform: "capitalize",
  },
  summary: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgSoft,
    borderColor: theme.colors.border,
    marginBottom: 12,
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
  dayCellText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "600",
  },
  legendText: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  summaryText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  dayCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  dayDate: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  dayMeta: {
    color: theme.colors.textSoft,
  },
});

