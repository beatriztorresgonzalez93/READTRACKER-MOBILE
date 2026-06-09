// Calendario de lectura mensual con leyenda y sesiones del día.
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { Platform } from "react-native";

import { buildReadingCalendarWeeks } from "@/features/readingSessions/build-reading-calendar-weeks";
import { ReadingSessionCard } from "@/features/readingSessions/reading-session-card";
import { readingIntensityColor } from "@/features/readingSessions/reading-calendar-intensity";
import type { HistorySessionByDay } from "@/features/readingSessions/use-history-sessions-by-day";

const isWeb = Platform.OS === "web";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

const LEGEND_ITEMS = [
  { label: "0", pages: 0 },
  { label: "1-10", pages: 10 },
  { label: "11-25", pages: 25 },
  { label: "26-40", pages: 40 },
  { label: "41+", pages: 50 },
] as const;

type ReadingCalendarProps = {
  year: number;
  month: number;
  days: { date: string; pagesRead: number }[];
  selectedDay: string | null;
  onSelectDay: (dateKey: string) => void;
  selectedSessions: HistorySessionByDay[];
  deleteDisabled?: boolean;
  onDeleteSession: (session: { id: string; title: string }) => void;
};

export function ReadingCalendar({
  year,
  month,
  days,
  selectedDay,
  onSelectDay,
  selectedSessions,
  deleteDisabled,
  onDeleteSession,
}: ReadingCalendarProps) {
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pagesByDate = new Map(days.map((day) => [day.date, day.pagesRead]));
  const calendarWeeks = buildReadingCalendarWeeks(year, month, pagesByDate);

  return (
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
        {WEEKDAY_LABELS.map((weekDay) => (
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
                  onPress={() => onSelectDay(cell.key)}
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
                    bg={readingIntensityColor(cell.pages)}
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
        {LEGEND_ITEMS.map((item) => (
          <HStack key={item.label} alignItems="center" space="sm">
            <Box
              w={isWeb ? 14 : 18}
              h={isWeb ? 14 : 18}
              borderRadius="$sm"
              borderWidth={isWeb ? 1 : 0}
              borderColor="$primary200"
              style={{ backgroundColor: readingIntensityColor(item.pages) }}
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
            <>
              {!isWeb ? (
                <Text size="xs" color="$textLight500" mb="$1">
                  Desliza una sesión hacia la izquierda para eliminarla.
                </Text>
              ) : null}
              {selectedSessions.map((session) => (
                <ReadingSessionCard
                  key={session.id}
                  session={session}
                  disabled={deleteDisabled}
                  timeLabel={timeFormatter.format(new Date(session.recordedAt))}
                  onDelete={() => onDeleteSession({ id: session.id, title: session.title })}
                />
              ))}
            </>
          ) : (
            <Text size="xs" color="$textLight500">
              No hay detalle de sesiones para ese día.
            </Text>
          )}
        </VStack>
      ) : null}
    </VStack>
  );
}
