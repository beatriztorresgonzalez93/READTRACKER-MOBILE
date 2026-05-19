// Historial de lectura mensual y calendario de lectura (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  HStack,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Platform } from "react-native";

import {
  useDeleteReadingSession,
  useMonthlyHistory,
  useReadingSessionsList,
} from "@/features/readingSessions/use-history";
import { AppLoader } from "@/shared/ui/app-loader";
import { Screen } from "@/shared/ui/screen";

const isWeb = Platform.OS === "web";

function intensityColor(pages = 0) {
  if (pages <= 0) return "#F3E9D7";
  if (pages <= 10) return "#E3CFA8";
  if (pages <= 25) return "#C9A36A";
  if (pages <= 40) return "#A0713F";
  return "#6B4528";
}

export default function HistoryScreen() {
  const ListComponent: typeof FlatList | typeof FlashList =
    Platform.OS === "web" || Constants.appOwnership === "expo" ? FlatList : FlashList;
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
    for (const session of sessionsQuery.data ?? []) {
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
      <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
        <Box p="$4">
          <Text size="sm" color="$textLight500" lineHeight={22}>
            No se pudo cargar el historial. Comprueba tu conexion y vuelve a intentarlo.
          </Text>
        </Box>
      </Screen>
    );
  }

  const firstDay = new Date(history.selected.year, history.selected.month - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(history.selected.year, history.selected.month, 0).getDate();
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

  const selectedSessions = selectedDay ? (sessionsByDay.get(selectedDay) ?? []) : [];

  function onDeleteSession(session: { id: string; title: string }) {
    router.push({
      pathname: "/(app)/history/delete-session",
      params: { sessionId: session.id, title: session.title },
    } as never);
  }

  const monthLabel = monthFormatter.format(
    new Date(history.selected.year, history.selected.month - 1, 1),
  );

  const calendarBody = (
    <VStack space="sm">
      <Text
        size={isWeb ? "md" : "lg"}
        fontWeight="$bold"
        color="$primary800"
        textAlign="center"
        mb="$1"
      >
        Calendario de lectura
      </Text>

      <HStack justifyContent="space-between" mb="$1" gap={isWeb ? 6 : 8}>
        {["L", "M", "X", "J", "V", "S", "D"].map((weekDay) => (
          <Box key={weekDay} flex={1} alignItems="center">
            <Text size="xs" fontWeight="$bold" color="$textLight500">
              {weekDay}
            </Text>
          </Box>
        ))}
      </HStack>

      <VStack space={isWeb ? "xs" : "sm"}>
        {calendarWeeks.map((week, weekIdx) => (
          <HStack key={`week-${weekIdx}`} width="100%" gap={isWeb ? 6 : 8}>
            {week.map((cell) => {
              const pages = cell.pages ?? 0;
              const onDark = pages >= 26;
              return (
                <Pressable
                  key={cell.key}
                  flex={1}
                  disabled={!cell.day || !cell.pages}
                  onPress={() => setSelectedDay(cell.key)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    cell.day ? `Día ${cell.day}, ${pages} páginas` : undefined
                  }
                >
                  <Box
                    aspectRatio={isWeb ? 1.35 : 1}
                    minHeight={isWeb ? undefined : 40}
                    borderRadius={isWeb ? "$sm" : "$md"}
                    borderWidth={selectedDay === cell.key ? 2 : 1}
                    borderColor={selectedDay === cell.key ? "$primary400" : "$primary200"}
                    alignItems="center"
                    justifyContent="center"
                    bg={intensityColor(cell.pages)}
                  >
                    <Text
                      size="xs"
                      fontWeight="$bold"
                      color={onDark ? "$white" : "$primary800"}
                    >
                      {cell.day ?? ""}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        ))}
      </VStack>

      <HStack flexWrap="wrap" gap={10} mt="$3">
        {[
          { label: "0", color: intensityColor(0) },
          { label: "1-10", color: intensityColor(10) },
          { label: "11-25", color: intensityColor(25) },
          { label: "26-40", color: intensityColor(40) },
          { label: "41+", color: intensityColor(50) },
        ].map((item) => (
          <HStack key={item.label} alignItems="center" space="sm">
            <Box
              w={isWeb ? 14 : 18}
              h={isWeb ? 14 : 18}
              borderRadius="$sm"
              borderWidth={isWeb ? 1 : 0}
              borderColor="$primary200"
              style={{ backgroundColor: item.color }}
            />
            <Text size="xs" color="$textLight500">
              {item.label}
            </Text>
          </HStack>
        ))}
      </HStack>

      {selectedDay ? (
        <VStack space="sm" mt="$3">
          <Text size={isWeb ? "sm" : "md"} fontWeight="$bold" color="$primary800">
            Sesiones del {dateFormatter.format(new Date(selectedDay))}
          </Text>
          {selectedSessions.length > 0 ? (
            selectedSessions.map((session) => (
              <Box
                key={session.id}
                borderRadius="$lg"
                borderWidth={isWeb ? 1 : 0}
                borderColor="$primary200"
                bg="$white"
                px="$3"
                py="$2"
                gap={4}
              >
                <HStack alignItems="center" justifyContent="space-between" gap="$2">
                  <Text flex={1} size="sm" fontWeight="$bold" color="$primary800" numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      onDeleteSession({ id: session.id, title: session.title })
                    }
                    disabled={deleteSession.isPending}
                    accessibilityLabel="Eliminar sesión"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={isWeb ? 16 : 18}
                      color="#7A6555"
                    />
                  </Pressable>
                </HStack>
                <Text size="xs" color="$textLight500" numberOfLines={1}>
                  {session.author || "Autor desconocido"}
                </Text>
                <Text size="xs" color="$textLight500">
                  Paginas:{" "}
                  {Math.max(
                    0,
                    (session.previousPage ?? session.currentPage - session.pagesRead) + 1,
                  )}{" "}
                  - {session.currentPage}
                </Text>
                <Text size="xs" color="$textLight500">
                  Hora: {timeFormatter.format(new Date(session.recordedAt))}
                </Text>
              </Box>
            ))
          ) : (
            <Text size="xs" color="$textLight500">
              No hay detalle de sesiones para ese día.
            </Text>
          )}
        </VStack>
      ) : null}
    </VStack>
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
            <HStack
              alignItems="center"
              justifyContent="space-between"
              mb={isWeb ? "$2" : "$4"}
              gap="$2"
            >
              <Pressable
                onPress={history.previousMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
                w={44}
                h={44}
                borderRadius="$full"
                borderWidth={1}
                borderColor="$primary200"
                bg="$white"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="chevron-back" size={22} color="#A87D42" />
              </Pressable>
              <Text
                flex={1}
                size={isWeb ? "md" : "lg"}
                fontWeight="$bold"
                color="$primary800"
                textAlign="center"
                textTransform="capitalize"
                numberOfLines={1}
              >
                {monthLabel}
              </Text>
              <Pressable
                onPress={history.nextMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
                w={44}
                h={44}
                borderRadius="$full"
                borderWidth={1}
                borderColor="$primary200"
                bg="$white"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="chevron-forward" size={22} color="#A87D42" />
              </Pressable>
            </HStack>

            <Box
              borderRadius="$xl"
              bg="$white"
              borderWidth={1}
              borderColor="$primary200"
              p="$4"
              mb="$3"
            >
              {calendarBody}
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
