// Muestra el historial de lectura mensual y el calendario de sesiones.
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { useDeleteReadingSession, useMonthlyHistory, useReadingSessionsList } from "@/features/readingSessions/use-history";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

export default function HistoryScreen() {
  const ListComponent: any = Constants.appOwnership === "expo" ? FlatList : FlashList;
  const appTheme = useAppTheme();
  const history = useMonthlyHistory();
  const sessionsQuery = useReadingSessionsList();
  const deleteSession = useDeleteReadingSession();
  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{ id: string; title: string } | null>(null);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, {
      id: string;
      title: string;
      author: string;
      bookId: string;
      pagesRead: number;
      previousPage?: number;
      currentPage: number;
      recordedAt: string;
    }[]>();
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
        bookId: session.bookId,
        pagesRead: Math.max(0, session.pagesRead ?? 0),
        previousPage: session.previousPage,
        currentPage: session.currentPage,
        recordedAt: session.recordedAt,
      });
      map.set(key, row);
    }
    return map;
  }, [sessionsQuery.data]);

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

  const selectedSessions = selectedDay ? sessionsByDay.get(selectedDay) ?? [] : [];

  function intensityColor(pages = 0) {
    if (pages <= 0) return "#F3E9D7";
    if (pages <= 10) return "#E3CFA8";
    if (pages <= 25) return "#C9A36A";
    if (pages <= 40) return "#A0713F";
    return "#6B4528";
  }

  function onDeleteSession(session: { id: string; title: string }) {
    setSelectedSession(session);
    setConfirmModalOpen(true);
  }

  function closeConfirmModal() {
    if (deleteSession.isPending) return;
    setConfirmModalOpen(false);
    setSelectedSession(null);
  }

  async function onConfirmDeleteSession() {
    if (!selectedSession) return;
    try {
      await deleteSession.mutateAsync(selectedSession.id);
      closeConfirmModal();
    } catch (error) {
      Alert.alert("No se pudo eliminar", (error as Error).message);
    }
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <ListComponent
        data={[{ id: "history-header-only" }]}
        keyExtractor={(item: { id: string }) => item.id}
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
              <Text style={[styles.monthLabel, { color: appTheme.colors.textOnDark }]}>
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
              <Text style={styles.calendarTitle}>Calendario de intensidad</Text>
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
                        <View style={styles.sessionMiniHeader}>
                          <Text style={styles.sessionMiniTitle} numberOfLines={1}>
                            {session.title}
                          </Text>
                          <Pressable
                            hitSlop={10}
                            onPress={() => onDeleteSession({ id: session.id, title: session.title })}
                            disabled={deleteSession.isPending}
                            accessibilityLabel="Eliminar sesion"
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.colors.textSoft} />
                          </Pressable>
                        </View>
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

      <Modal
        visible={confirmModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Eliminar sesión</Text>
            <Text style={styles.confirmBody}>
              {`¿Seguro que quieres eliminar la sesión de "${selectedSession?.title ?? ""}"?`}
            </Text>
            <View style={styles.confirmActionsRow}>
              <Button mode="outlined" onPress={closeConfirmModal} style={styles.confirmCancelBtn}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.danger}
                onPress={onConfirmDeleteSession}
                loading={deleteSession.isPending}
                disabled={deleteSession.isPending}
                style={styles.confirmDeleteBtn}
              >
                Eliminar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
    fontFamily: "Fraunces_400Regular",
  },
  monthLabel: {
    fontFamily: "Fraunces_700Bold",
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
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
    fontSize: 17,
    marginBottom: 8,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  weekDayLabel: {
    width: "14%",
    textAlign: "center",
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Fraunces_700Bold",
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
    fontFamily: "Fraunces_700Bold",
  },
  dayCellTextOnDark: {
    color: theme.colors.textOnDark,
  },
  errorText: {
    color: theme.colors.textOnDark,
    fontFamily: "Fraunces_400Regular",
  },
  legendText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontFamily: "Fraunces_400Regular",
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
    fontFamily: "Fraunces_700Bold",
  },
  sessionMiniCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sessionMiniHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionMiniTitle: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: "700",
    fontFamily: "Fraunces_700Bold",
  },
  sessionMiniMeta: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontFamily: "Fraunces_400Regular",
  },
  sessionEmptyText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontFamily: "Fraunces_400Regular",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  confirmCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
    padding: 14,
    gap: 8,
  },
  confirmTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
  },
  confirmBody: {
    color: theme.colors.textSoft,
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  confirmCancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderColor: theme.colors.border,
  },
  confirmDeleteBtn: {
    flex: 1,
    borderRadius: 10,
  },
});

