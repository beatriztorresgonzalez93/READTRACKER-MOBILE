// Historial de lectura mensual y calendario de lectura (gluestack-ui).
import { Box, Text } from "@gluestack-ui/themed";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Platform } from "react-native";

import { HistoryMonthHeader } from "@/features/readingSessions/history-month-header";
import { ReadingCalendar } from "@/features/readingSessions/reading-calendar";
import {
  useDeleteReadingSession,
  useMonthlyHistory,
  useReadingSessionsList,
} from "@/features/readingSessions/use-history";
import { useHistorySessionsByDay } from "@/features/readingSessions/use-history-sessions-by-day";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";

const isWeb = Platform.OS === "web";

export default function HistoryScreen() {
  const ListComponent: typeof FlatList | typeof FlashList =
    Platform.OS === "web" || Constants.appOwnership === "expo" ? FlatList : FlashList;
  const history = useMonthlyHistory();
  const sessionsQuery = useReadingSessionsList();
  const deleteSession = useDeleteReadingSession();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const sessionsByDay = useHistorySessionsByDay(sessionsQuery.data);
  const selectedSessions = selectedDay ? (sessionsByDay.get(selectedDay) ?? []) : [];

  if (history.isLoading && !history.data) {
    return <AppLoader />;
  }

  if (history.isError) {
    return (
      <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
        <Box p="$4">
          <Text size="sm" color="$textLight500" lineHeight={22}>
            No se pudo cargar el historial. Comprueba tu conexion y vuelve a intentarlo.
          </Text>
        </Box>
      </Screen>
    );
  }

  function onDeleteSession(session: { id: string; title: string }) {
    router.push({
      pathname: "/(app)/history/delete-session",
      params: { sessionId: session.id, title: session.title },
    } as never);
  }

  const monthLabel = monthFormatter.format(
    new Date(history.selected.year, history.selected.month - 1, 1),
  );

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{ paddingTop: isWeb ? 10 : 16 }}
    >
      <ListComponent
        data={[{ id: "history-header-only" }]}
        keyExtractor={(item: { id: string }) => item.id}
        ListHeaderComponent={
          <Box width="100%" maxWidth={980} alignSelf="center" mb="$3">
            <HistoryMonthHeader
              monthLabel={monthLabel}
              onPreviousMonth={history.previousMonth}
              onNextMonth={history.nextMonth}
            />

            <Box
              borderRadius="$xl"
              bg="$white"
              borderWidth={1}
              borderColor="$primary200"
              p="$4"
              mb="$3"
            >
              <ReadingCalendar
                year={history.selected.year}
                month={history.selected.month}
                days={history.data?.days ?? []}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                selectedSessions={selectedSessions}
                deleteDisabled={deleteSession.isPending}
                onDeleteSession={onDeleteSession}
              />
            </Box>
          </Box>
        }
        ListEmptyComponent={null}
        renderItem={() => null}
        ItemSeparatorComponent={() => <Box h={isWeb ? 8 : 12} />}
        contentContainerStyle={{
          paddingBottom: isWeb ? 24 : 36,
          flexGrow: 1,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
