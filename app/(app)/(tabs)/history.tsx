// Muestra el historial de lectura mensual y el calendario de sesiones.
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { useMemo, useState } from "react";
import type { TextProps as RNTextProps } from "react-native";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text as RNText,
    View,
} from "react-native";
import { Button, Card, Text as PaperText } from "react-native-paper";

import {
    useDeleteReadingSession,
    useMonthlyHistory,
    useReadingSessionsList,
} from "@/features/readingSessions/use-history";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";
import { useAppTheme } from "@/shared/ui/use-app-theme";

function HistoryText({ children, ...rest }: RNTextProps) {
  if (Platform.OS === "web") {
    return <PaperText {...rest}>{children}</PaperText>;
  }
  return <RNText {...rest}>{children}</RNText>;
}

export default function HistoryScreen() {
  const ListComponent: any =
    Platform.OS === "web"
      ? FlatList
      : Constants.appOwnership === "expo"
        ? FlatList
        : FlashList;
  const appTheme = useAppTheme();
  const history = useMonthlyHistory();
  const sessionsQuery = useReadingSessionsList();
  const deleteSession = useDeleteReadingSession();
  const monthFormatter = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  });
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sessionsByDay = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        title: string;
        author: string;
        bookId: string;
        pagesRead: number;
        previousPage?: number;
        currentPage: number;
        recordedAt: string;
      }[]
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
        <HistoryText style={styles.errorText}>
          No se pudo cargar el historial. Comprueba tu conexion y vuelve a
          intentarlo.
        </HistoryText>
      </Screen>
    );
  }

  const firstDay = new Date(
    history.selected.year,
    history.selected.month - 1,
    1,
  );
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    history.selected.year,
    history.selected.month,
    0,
  ).getDate();
  const pagesByDate = new Map(
    (history.data?.days ?? []).map((day) => [day.date, day.pagesRead]),
  );
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

  const calendarWeeks: (typeof calendarCells)[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    calendarWeeks.push(calendarCells.slice(i, i + 7));
  }

  const selectedSessions = selectedDay
    ? (sessionsByDay.get(selectedDay) ?? [])
    : [];

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

  const calendarBody = (
    <>
      <HistoryText
        style={[
          styles.calendarTitle,
          Platform.OS !== "web" ? styles.calendarTitleNative : null,
        ]}
      >
        Calendario de intensidad
      </HistoryText>
      <View
        style={[
          styles.weekRow,
          Platform.OS !== "web" ? styles.weekRowNative : null,
        ]}
      >
        {["L", "M", "X", "J", "V", "S", "D"].map((weekDay) => (
          <HistoryText key={weekDay} style={styles.weekDayLabel}>
            {weekDay}
          </HistoryText>
        ))}
      </View>
      <View
        style={[
          styles.calendarGrid,
          Platform.OS !== "web" ? styles.calendarGridNative : null,
        ]}
      >
        {calendarWeeks.map((week, weekIdx) => (
          <View
            key={`week-${weekIdx}`}
            style={[
              styles.calendarWeekRow,
              Platform.OS !== "web" ? styles.calendarWeekRowNative : null,
            ]}
          >
            {week.map((cell) => (
              <Pressable
                key={cell.key}
                disabled={!cell.day || !cell.pages}
                onPress={() => setSelectedDay(cell.key)}
                style={[
                  styles.dayCell,
                  Platform.OS !== "web" ? styles.dayCellNative : null,
                  { backgroundColor: intensityColor(cell.pages) },
                  selectedDay === cell.key ? styles.dayCellSelected : null,
                ]}
              >
                <HistoryText
                  style={[
                    styles.dayCellText,
                    Platform.OS !== "web" ? styles.dayCellTextNative : null,
                    (cell.pages ?? 0) >= 26 ? styles.dayCellTextOnDark : null,
                  ]}
                >
                  {cell.day ?? ""}
                </HistoryText>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      <View
        style={[
          styles.legendRow,
          Platform.OS !== "web" ? styles.legendRowNative : null,
        ]}
      >
        {[
          { label: "0", color: intensityColor(0) },
          { label: "1-10", color: intensityColor(10) },
          { label: "11-25", color: intensityColor(25) },
          { label: "26-40", color: intensityColor(40) },
          { label: "41+", color: intensityColor(50) },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                Platform.OS !== "web" ? styles.legendSwatchNative : null,
                { backgroundColor: item.color },
              ]}
            />
            <HistoryText style={styles.legendText}>{item.label}</HistoryText>
          </View>
        ))}
      </View>
      {selectedDay ? (
        <View
          style={[
            styles.sessionsBlock,
            Platform.OS !== "web" ? styles.sessionsBlockNative : null,
          ]}
        >
          <HistoryText
            style={[
              styles.sessionsTitle,
              Platform.OS !== "web" ? styles.sessionsTitleNative : null,
            ]}
          >
            Sesiones del {dateFormatter.format(new Date(selectedDay))}
          </HistoryText>
          {selectedSessions.length > 0 ? (
            selectedSessions.map((session) => (
              <View
                key={session.id}
                style={[
                  styles.sessionMiniCard,
                  Platform.OS !== "web" ? styles.sessionMiniCardNative : null,
                ]}
              >
                <View style={styles.sessionMiniHeader}>
                  <HistoryText
                    style={[
                      styles.sessionMiniTitle,
                      Platform.OS !== "web"
                        ? styles.sessionMiniTitleNative
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {session.title}
                  </HistoryText>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      onDeleteSession({
                        id: session.id,
                        title: session.title,
                      })
                    }
                    disabled={deleteSession.isPending}
                    accessibilityLabel="Eliminar sesión"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={Platform.OS === "web" ? 16 : 18}
                      color={theme.colors.textSoft}
                    />
                  </Pressable>
                </View>
                <HistoryText
                  style={[
                    styles.sessionMiniMeta,
                    Platform.OS !== "web" ? styles.sessionMiniMetaNative : null,
                  ]}
                  numberOfLines={1}
                >
                  {session.author || "Autor desconocido"}
                </HistoryText>
                <HistoryText
                  style={[
                    styles.sessionMiniMeta,
                    Platform.OS !== "web" ? styles.sessionMiniMetaNative : null,
                  ]}
                >
                  Paginas:{" "}
                  {Math.max(
                    0,
                    (session.previousPage ??
                      session.currentPage - session.pagesRead) + 1,
                  )}{" "}
                  - {session.currentPage}
                </HistoryText>
                <HistoryText
                  style={[
                    styles.sessionMiniMeta,
                    Platform.OS !== "web" ? styles.sessionMiniMetaNative : null,
                  ]}
                >
                  Hora:{" "}
                  {timeFormatter.format(new Date(session.recordedAt))}
                </HistoryText>
              </View>
            ))
          ) : (
            <HistoryText style={styles.sessionEmptyText}>
              No hay detalle de sesiones para ese día.
            </HistoryText>
          )}
        </View>
      ) : null}
    </>
  );

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      style={[
        styles.screen,
        Platform.OS !== "web" ? styles.screenNative : null,
      ]}
    >
      <ListComponent
        data={[{ id: "history-header-only" }]}
        keyExtractor={(item: { id: string }) => item.id}
        ListHeaderComponent={
          <View
            style={[
              styles.headerContainer,
              Platform.OS !== "web" ? styles.headerContainerNative : null,
            ]}
          >
            <View
              style={[
                styles.monthControls,
                Platform.OS !== "web" ? styles.monthControlsNative : null,
              ]}
            >
              {Platform.OS === "web" ? (
                <>
                  <Button
                    mode="outlined"
                    style={styles.navBtn}
                    labelStyle={styles.navBtnLabel}
                    onPress={history.previousMonth}
                  >
                    Mes anterior
                  </Button>
                  <PaperText
                    style={[
                      styles.monthLabel,
                      { color: appTheme.colors.textOnDark },
                    ]}
                  >
                    {monthFormatter.format(
                      new Date(
                        history.selected.year,
                        history.selected.month - 1,
                        1,
                      ),
                    )}
                  </PaperText>
                  <Button
                    mode="outlined"
                    style={styles.navBtn}
                    labelStyle={styles.navBtnLabel}
                    onPress={history.nextMonth}
                  >
                    Mes siguiente
                  </Button>
                </>
              ) : (
                <>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.navBtnNative,
                      pressed ? styles.navBtnNativePressed : null,
                    ]}
                    onPress={history.previousMonth}
                  >
                    <HistoryText style={styles.navBtnNativeLabel}>
                      Mes anterior
                    </HistoryText>
                  </Pressable>
                  <HistoryText
                    style={[
                      styles.monthLabel,
                      styles.monthLabelNative,
                      { color: appTheme.colors.textOnDark },
                    ]}
                    numberOfLines={2}
                  >
                    {monthFormatter.format(
                      new Date(
                        history.selected.year,
                        history.selected.month - 1,
                        1,
                      ),
                    )}
                  </HistoryText>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.navBtnNative,
                      pressed ? styles.navBtnNativePressed : null,
                    ]}
                    onPress={history.nextMonth}
                  >
                    <HistoryText style={styles.navBtnNativeLabel}>
                      Mes siguiente
                    </HistoryText>
                  </Pressable>
                </>
              )}
            </View>

            {Platform.OS === "web" ? (
              <Card mode="outlined" style={styles.calendarCard}>
                <Card.Content>{calendarBody}</Card.Content>
              </Card>
            ) : (
              <View style={[styles.calendarCard, styles.calendarCardNative]}>
                <View style={styles.calendarCardInner}>{calendarBody}</View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={null}
        renderItem={() => null}
        ItemSeparatorComponent={() => (
          <View style={{ height: Platform.OS === "web" ? 8 : 12 }} />
        )}
        contentContainerStyle={[
          styles.listContent,
          Platform.OS !== "web" ? styles.listContentNative : null,
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={confirmModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        {Platform.OS === "web" ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.confirmCard}>
              <PaperText style={styles.confirmTitle}>Eliminar sesión</PaperText>
              <PaperText style={styles.confirmBody}>
                {`¿Seguro que quieres eliminar la sesión de "${selectedSession?.title ?? ""}"?`}
              </PaperText>
              <View style={styles.confirmActionsRow}>
                <Button
                  mode="outlined"
                  onPress={closeConfirmModal}
                  style={styles.confirmCancelBtn}
                >
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
        ) : (
          <Pressable
            style={[styles.modalBackdrop, styles.modalBackdropMobile]}
            onPress={closeConfirmModal}
          >
            <Pressable
              style={[styles.confirmCard, styles.confirmCardMobile]}
              onPress={(e) => e.stopPropagation()}
            >
              <HistoryText style={styles.confirmTitle}>Eliminar sesión</HistoryText>
              <HistoryText style={styles.confirmBody}>
                {`¿Seguro que quieres eliminar la sesión de "${selectedSession?.title ?? ""}"?`}
              </HistoryText>
              <View style={styles.confirmActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.confirmBtnNative,
                    styles.confirmBtnNativeCancel,
                    pressed ? styles.navBtnNativePressed : null,
                  ]}
                  onPress={closeConfirmModal}
                  disabled={deleteSession.isPending}
                >
                  <HistoryText style={styles.confirmBtnNativeCancelLabel}>
                    Cancelar
                  </HistoryText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.confirmBtnNative,
                    styles.confirmBtnNativeDelete,
                    pressed ? styles.confirmBtnNativeDeletePressed : null,
                  ]}
                  onPress={onConfirmDeleteSession}
                  disabled={deleteSession.isPending}
                >
                  {deleteSession.isPending ? (
                    <ActivityIndicator
                      color={theme.colors.textOnDark}
                      size="small"
                    />
                  ) : (
                    <HistoryText style={styles.confirmBtnNativeDeleteLabel}>
                      Eliminar
                    </HistoryText>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 10,
  },
  screenNative: {
    paddingTop: 16,
  },
  headerContainer: {
    marginBottom: 12,
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  listContentNative: {
    paddingBottom: 36,
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
    gap: 6,
  },
  weekDayLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Fraunces_700Bold",
  },
  calendarGrid: {
    flexDirection: "column",
    gap: 6,
  },
  calendarWeekRow: {
    flexDirection: "row",
    width: "100%",
    gap: 6,
  },
  dayCell: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1.35,
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
    marginTop: 14,
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
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
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
  headerContainerNative: {
    marginBottom: 20,
  },
  monthControlsNative: {
    marginBottom: 22,
    gap: 12,
    alignItems: "stretch",
  },
  navBtnNative: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnNativePressed: {
    backgroundColor: theme.colors.bgSoft,
    opacity: 0.9,
  },
  navBtnNativeLabel: {
    fontSize: 11,
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.text,
    textAlign: "center",
  },
  monthLabelNative: {
    flexShrink: 1,
    flexBasis: "36%",
    fontSize: 23,
    lineHeight: 27,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  calendarCardNative: {
    borderRadius: 16,
    borderWidth: 0,
    overflow: "visible",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2914",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  calendarCardInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  calendarTitleNative: {
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 12,
  },
  calendarGridNative: {
    gap: 8,
  },
  calendarWeekRowNative: {
    gap: 8,
  },
  weekRowNative: {
    marginBottom: 8,
  },
  dayCellNative: {
    borderWidth: 0,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2914",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  dayCellTextNative: {
    fontSize: 13,
  },
  legendRowNative: {
    marginTop: 18,
    gap: 12,
  },
  legendSwatchNative: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 0,
  },
  sessionsBlockNative: {
    marginTop: 22,
    gap: 10,
  },
  sessionsTitleNative: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    marginBottom: 2,
  },
  sessionMiniCardNative: {
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2914",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  sessionMiniTitleNative: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Fraunces_700Bold",
  },
  sessionMiniMetaNative: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: "Fraunces_400Regular",
  },
  modalBackdropMobile: {
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingTop: 48,
  },
  confirmCardMobile: {
    maxWidth: "100%",
    width: "100%",
    alignSelf: "stretch",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    paddingBottom: 28,
    paddingTop: 22,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#1A0F08",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
      default: {},
    }),
  },
  confirmBtnNative: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  confirmBtnNativeCancel: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardElevated,
  },
  confirmBtnNativeCancelLabel: {
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.text,
    fontSize: 15,
  },
  confirmBtnNativeDelete: {
    backgroundColor: theme.colors.danger,
  },
  confirmBtnNativeDeletePressed: {
    opacity: 0.88,
  },
  confirmBtnNativeDeleteLabel: {
    color: theme.colors.textOnDark,
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
});
