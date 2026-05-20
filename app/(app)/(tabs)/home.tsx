// Inicio: lectura actual, resumen y última actividad (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Pressable,
  Progress,
  ProgressFilledTrack,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBooksSummary, useLeidosHomeCarousel, useLeyendoPreview } from "@/features/books/use-books";
import { useReadingSessionsList } from "@/features/readingSessions/use-history";
import type { Book } from "@/shared/types/books";
import type { ReadingSession } from "@/shared/types/reading-session";
import { webFlattenStyle } from "@/shared/lib/web-style";
import { AppButton } from "@/shared/ui/app-button";
import { AppLink } from "@/shared/ui/app-link";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";

const isWeb = Platform.OS === "web";
const MS_PER_DAY = 86400000;

function countSessionsSince(sessions: ReadingSession[], sinceMs: number) {
  let n = 0;
  for (const s of sessions) {
    const at = Date.parse(s.recordedAt || s.createdAt);
    if (Number.isFinite(at) && at >= sinceMs) n += 1;
  }
  return n;
}

function bookRecencyMs(book: Book): number {
  const raw = book.lastPageMarkedAt ?? book.updatedAt ?? "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const summary = useBooksSummary();
  const leyendoQuery = useLeyendoPreview();
  const leidosCarousel = useLeidosHomeCarousel();
  const sessionsQuery = useReadingSessionsList();

  const latestSessionByBook = useMemo(() => {
    const map = new Map<string, { currentPage: number; at: number }>();
    for (const session of sessionsQuery.data ?? []) {
      const at = Date.parse(session.recordedAt || session.createdAt);
      const current = map.get(session.bookId);
      if (!current || at > current.at) {
        map.set(session.bookId, {
          currentPage: Math.max(0, session.currentPage),
          at,
        });
      }
    }
    return map;
  }, [sessionsQuery.data]);

  const primaryBook = useMemo((): Book | null => {
    const first = leyendoQuery.data?.[0];
    if (!first) return null;
    const latest = latestSessionByBook.get(first.id);
    if (!latest || !first.pages || first.pages <= 0) return first;
    const progressFromSession = Math.max(
      0,
      Math.min(100, Math.round((latest.currentPage / first.pages) * 100)),
    );
    return { ...first, progress: progressFromSession };
  }, [leyendoQuery.data, latestSessionByBook]);

  const sessions30d = useMemo(() => {
    const since = Date.now() - 30 * MS_PER_DAY;
    return countSessionsSince(sessionsQuery.data ?? [], since);
  }, [sessionsQuery.data]);

  const leidosSorted = useMemo(() => {
    const items = [...(leidosCarousel.data ?? [])];
    items.sort((a, b) => bookRecencyMs(b) - bookRecencyMs(a));
    return items.slice(0, 10);
  }, [leidosCarousel.data]);

  const genreVariety = useMemo(() => {
    const rows = summary.data?.genres ?? [];
    return rows.filter((g) => g && typeof g.genre === "string" && g.count > 0).length;
  }, [summary.data?.genres]);

  const bookDateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  if (
    (summary.isLoading && !summary.data) ||
    (leyendoQuery.isLoading && !leyendoQuery.data)
  ) {
    return <AppLoader />;
  }

  const s = summary.data;
  const progress = Math.max(0, Math.min(100, Math.round(primaryBook?.progress ?? 0)));

  const cardProps = isWeb
    ? { maxWidth: 560, alignSelf: "center" as const, width: "100%" as const }
    : {};

  return (
    <Screen edges={["bottom", "left", "right"]} backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24 + insets.bottom,
          paddingTop: isWeb ? insets.top + 72 : 8,
        }}
      >
        <VStack space="md">
          <Heading size="xl" color="$primary800" fontFamily="$heading">
            Tu espacio de lectura
          </Heading>

          {primaryBook ? (
            <AppLink
              href={`/(app)/books/${primaryBook.id}` as never}
              style={webFlattenStyle({ width: "100%" })}
              accessibilityRole="button"
              accessibilityLabel={`Continuar leyendo: ${primaryBook.title}`}
            >
              <Box
                borderRadius="$2xl"
                bg="$white"
                p="$4"
                borderWidth={1}
                borderColor="$primary200"
                {...cardProps}
              >
                <HStack space="sm" alignItems="center" mb="$3">
                  <Ionicons name="book-outline" size={18} color="#A87D42" />
                  <Text
                    size="xs"
                    fontWeight="$bold"
                    color="$textLight500"
                    textTransform="uppercase"
                    letterSpacing={1}
                  >
                    Leyendo ahora
                  </Text>
                </HStack>
                <HStack space="md" alignItems="flex-start">
                <BookCover
                  uri={primaryBook.coverUrl}
                  title={primaryBook.title}
                  width={isWeb ? 100 : 92}
                    aspectRatio={1.45}
                    borderRadius={12}
                    accessibilityLabel={`Portada: ${primaryBook.title}`}
                  />
                  <VStack flex={1} space="xs" minWidth={0}>
                    <Text size="lg" fontWeight="$bold" color="$primary800" numberOfLines={3}>
                      {primaryBook.title}
                    </Text>
                    <Text size="sm" color="$textLight500" numberOfLines={2}>
                      {primaryBook.author ?? "Autor desconocido"}
                    </Text>
                    <Text size="xs" color="$textLight500" mt="$1">
                      Avance · {progress}%
                    </Text>
                    <Progress value={progress} size="sm" w="100%" mt="$1" bg="$primary100">
                      <ProgressFilledTrack bg="$primary500" />
                    </Progress>
                  </VStack>
                </HStack>
                <HStack justifyContent="flex-end" alignItems="center" space="xs" mt="$3">
                  <Text size="sm" fontWeight="$bold" color="$primary600">
                    Abrir libro
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#A87D42" />
                </HStack>
              </Box>
            </AppLink>
          ) : (
            <VStack
              borderRadius="$2xl"
              bg="$white"
              p="$6"
              alignItems="center"
              space="sm"
              borderWidth={1}
              borderColor="$primary200"
              {...cardProps}
            >
              <Ionicons name="library-outline" size={36} color="#7A6555" />
              <Text size="md" fontWeight="$bold" color="$primary800" textAlign="center">
                Aún no tienes un libro en curso
              </Text>
              <Text size="sm" color="$textLight500" textAlign="center" lineHeight={20}>
                Marca un libro como «Leyendo» en tu biblioteca o añade uno nuevo.
              </Text>
              <AppButton
                label="Ir a la biblioteca"
                onPress={() => router.push("/(app)/(tabs)/index" as never)}
              />
            </VStack>
          )}

          <HStack
            space="md"
            alignItems="flex-start"
            p="$3"
            borderRadius="$xl"
            bg="$white"
            borderWidth={1}
            borderColor="$primary200"
            {...cardProps}
          >
            <Ionicons name="pulse-outline" size={22} color="#A87D42" />
            <VStack flex={1} space="xs">
              <Text size="sm" fontWeight="$bold" color="$primary800">
                Actividad reciente
              </Text>
              <Text size="sm" color="$textLight500" lineHeight={20}>
                {sessionsQuery.isLoading && !sessionsQuery.data
                  ? "Cargando tus sesiones…"
                  : sessions30d === 0
                    ? "En los últimos 30 días no hay sesiones registradas. Anota páginas cuando leas."
                    : `En los últimos 30 días has registrado ${sessions30d} sesión${sessions30d === 1 ? "" : "es"} de lectura.`}
              </Text>
            </VStack>
          </HStack>

          <VStack space="xs">
            <Text size="md" fontWeight="$bold" color="$primary800" mt="$2" mb="$2">
              Resumen rápido
            </Text>
            <Box flexDirection="row" flexWrap="wrap" gap={10}>
              <MetricTile icon="library-outline" label="Libros totales" value={String(s?.total ?? 0)} />
              <MetricTile icon="checkmark-done-outline" label="Libros leídos" value={String(s?.leido ?? 0)} />
              <MetricTile icon="hourglass-outline" label="Pendientes" value={String(s?.pendiente ?? 0)} />
              <MetricTile icon="heart-outline" label="Favoritos" value={String(s?.favoritos ?? 0)} />
              <MetricTile icon="pricetags-outline" label="Géneros" value={String(genreVariety)} />
              <MetricTile
                icon="trophy-outline"
                label="Mejor año"
                value={s?.latestYear != null && s.latestYear > 0 ? String(s.latestYear) : "—"}
              />
            </Box>
          </VStack>

          <VStack space="xs">
            <Text size="md" fontWeight="$bold" color="$primary800" mt="$2" mb="$2">
              Últimos libros leídos
            </Text>

            {leidosCarousel.isLoading && !leidosCarousel.data ? (
              <Box py="$6" alignItems="center">
                <ActivityIndicator color="#A87D42" />
              </Box>
            ) : leidosCarousel.isError ? (
              <Text size="sm" color="$textLight500" lineHeight={20}>
                No se pudieron cargar los libros leídos.
              </Text>
            ) : leidosSorted.length === 0 ? (
              <Text size="sm" color="$textLight500" lineHeight={20}>
                Cuando marques un libro como terminado, aparecerá aquí con su portada.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingRight: 8 }}
              >
                {leidosSorted.map((book) => {
                  const raw = book.lastPageMarkedAt ?? book.updatedAt ?? "";
                  let dateStr = "";
                  if (raw) {
                    try {
                      dateStr = bookDateFmt.format(new Date(raw));
                    } catch {
                      dateStr = "";
                    }
                  }
                  return (
                    <AppLink
                      key={book.id}
                      href={`/(app)/books/${book.id}` as never}
                      accessibilityRole="button"
                    >
                      <Box
                        width={108}
                        p="$2"
                        borderRadius="$lg"
                        bg="$white"
                        borderWidth={1}
                        borderColor="$primary200"
                        gap={6}
                      >
                    <BookCover
                      uri={book.coverUrl}
                      title={book.title}
                      width={72}
                          aspectRatio={1.45}
                          borderRadius={10}
                          accessibilityLabel={`Portada: ${book.title}`}
                        />
                        <Text size="xs" fontWeight="$bold" color="$primary800" numberOfLines={2}>
                          {book.title}
                        </Text>
                        <Text size="2xs" color="$textLight500" numberOfLines={1}>
                          {book.author ?? "Autor desconocido"}
                        </Text>
                        {dateStr ? (
                          <Text size="2xs" fontWeight="$bold" color="$primary600" mt="$0.5">
                            {dateStr}
                          </Text>
                        ) : null}
                      </Box>
                    </AppLink>
                  );
                })}
              </ScrollView>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <Box
      borderRadius="$lg"
      bg="$white"
      borderWidth={1}
      borderColor="$primary200"
      py="$3"
      px="$3"
      gap={6}
      style={{ width: "47%", minWidth: "45%", flexGrow: 1 }}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={20} color="#A87D42" />
      <Text size="2xl" fontWeight="$bold" color="$primary800">
        {value}
      </Text>
      <Text size="xs" color="$textLight500">
        {label}
      </Text>
    </Box>
  );
}
