// Inicio: lectura actual, resumen y última actividad de lectura.
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBooksSummary, useLeidosHomeCarousel, useLeyendoPreview } from "@/features/books/use-books";
import { useReadingSessionsList } from "@/features/readingSessions/use-history";
import type { Book } from "@/shared/types/books";
import type { ReadingSession } from "@/shared/types/reading-session";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

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
  const progress = Math.max(
    0,
    Math.min(100, Math.round(primaryBook?.progress ?? 0)),
  );

  return (
    <Screen edges={["bottom", "left", "right"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 24 + insets.bottom,
            paddingTop: isWeb ? insets.top + 72 : 8,
          },
        ]}
      >
        <Text style={styles.greeting}>Tu espacio de lectura</Text>

        {primaryBook ? (
          <Link href={`/(app)/books/${primaryBook.id}` as never} asChild>
            <Pressable
              style={[styles.heroCard, isWeb && styles.heroCardWeb]}
              accessibilityRole="button"
              accessibilityLabel={`Continuar leyendo: ${primaryBook.title}`}
            >
              <View style={styles.heroLabelRow}>
                <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.heroLabel}>Leyendo ahora</Text>
              </View>
              <View style={styles.heroBody}>
                <BookCover
                  uri={primaryBook.coverUrl}
                  width={isWeb ? 100 : 92}
                  aspectRatio={1.45}
                  borderRadius={12}
                  accessibilityLabel={`Portada: ${primaryBook.title}`}
                />
                <View style={styles.heroTextCol}>
                  <Text style={styles.heroTitle} numberOfLines={3}>
                    {primaryBook.title}
                  </Text>
                  <Text style={styles.heroAuthor} numberOfLines={2}>
                    {primaryBook.author ?? "Autor desconocido"}
                  </Text>
                  <Text style={styles.heroProgressLabel}>Avance · {progress}%</Text>
                  <ProgressBar
                    progress={progress / 100}
                    color={theme.colors.primary}
                    style={styles.heroProgressBar}
                  />
                </View>
              </View>
              <View style={styles.heroCtaRow}>
                <Text style={styles.heroCta}>Abrir libro</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
              </View>
            </Pressable>
          </Link>
        ) : (
          <Pressable
            style={[styles.emptyHero, isWeb && styles.heroCardWeb]}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          >
            <Ionicons name="library-outline" size={36} color={theme.colors.textSoft} />
            <Text style={styles.emptyHeroTitle}>Aún no tienes un libro en curso</Text>
            <Text style={styles.emptyHeroSub}>
              Marca un libro como «Leyendo» en tu biblioteca o añade uno nuevo.
            </Text>
            <View style={styles.emptyHeroBtn}>
              <Text style={styles.emptyHeroBtnText}>Ir a la biblioteca</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
            </View>
          </Pressable>
        )}

        <View style={[styles.insightCard, isWeb && styles.heroCardWeb]}>
          <Ionicons name="pulse-outline" size={22} color={theme.colors.primary} />
          <View style={styles.insightTextCol}>
            <Text style={styles.insightTitle}>Actividad reciente</Text>
            <Text style={styles.insightBody}>
              {sessionsQuery.isLoading && !sessionsQuery.data
                ? "Cargando tus sesiones…"
                : sessions30d === 0
                  ? "En los últimos 30 días no hay sesiones registradas. Anota páginas cuando leas."
                  : `En los últimos 30 días has registrado ${sessions30d} sesión${sessions30d === 1 ? "" : "es"} de lectura.`}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumen rápido</Text>
        <Text style={styles.sectionHint}>
          Total y leídos en tu biblioteca; pendientes, favoritos, géneros y el año más reciente en catálogo.
        </Text>
        <View style={styles.metricsGrid}>
          <MetricTile
            icon="library-outline"
            label="Libros totales"
            value={String(s?.total ?? 0)}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          />
          <MetricTile
            icon="checkmark-done-outline"
            label="Libros leídos"
            value={String(s?.leido ?? 0)}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          />
          <MetricTile
            icon="hourglass-outline"
            label="Pendientes"
            value={String(s?.pendiente ?? 0)}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          />
          <MetricTile
            icon="heart-outline"
            label="Favoritos"
            value={String(s?.favoritos ?? 0)}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          />
          <MetricTile
            icon="pricetags-outline"
            label="Géneros"
            value={String(genreVariety)}
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
          />
          <MetricTile
            icon="trophy-outline"
            label="Mejor año"
            value={s?.latestYear != null && s.latestYear > 0 ? String(s.latestYear) : "—"}
            onPress={() => router.push("/(app)/(tabs)/stats" as never)}
          />
        </View>

        <View style={styles.carouselHeaderRow}>
          <Text style={styles.sectionTitleCarousel}>Últimos libros leídos</Text>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/index" as never)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir biblioteca"
          >
            <Text style={styles.carouselLink}>Biblioteca</Text>
          </Pressable>
        </View>
        <Text style={styles.carouselSub}>
          Libros en estado «Leído», ordenados por la última actividad (máx. 10).
        </Text>
        {leidosCarousel.isLoading && !leidosCarousel.data ? (
          <View style={styles.carouselLoading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : leidosCarousel.isError ? (
          <Text style={styles.carouselEmpty}>No se pudieron cargar los libros leídos.</Text>
        ) : leidosSorted.length === 0 ? (
          <Text style={styles.carouselEmpty}>
            Cuando marques un libro como terminado, aparecerá aquí con su portada.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselList}
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
                <Link key={book.id} href={`/(app)/books/${book.id}` as never} asChild>
                  <Pressable style={styles.readCard} accessibilityRole="button">
                    <BookCover
                      uri={book.coverUrl}
                      width={72}
                      aspectRatio={1.45}
                      borderRadius={10}
                      accessibilityLabel={`Portada: ${book.title}`}
                    />
                    <Text style={styles.readCardTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.readCardAuthor} numberOfLines={1}>
                      {book.author ?? "Autor desconocido"}
                    </Text>
                    {dateStr ? <Text style={styles.readCardDate}>{dateStr}</Text> : null}
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetricTile({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.metricTile, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgSoft,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  greeting: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  heroCard: {
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    padding: 18,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  heroCardWeb: {
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },
  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heroLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    color: theme.colors.textSoft,
    textTransform: "uppercase",
  },
  heroBody: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  heroTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    lineHeight: 26,
    color: theme.colors.text,
  },
  heroAuthor: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    color: theme.colors.textSoft,
  },
  heroProgressLabel: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    color: theme.colors.textSoft,
    marginTop: 4,
  },
  heroProgressBar: {
    height: 8,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: theme.colors.bgSoft,
  },
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 14,
  },
  heroCta: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.primary,
  },
  emptyHero: {
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
  },
  emptyHeroTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
    color: theme.colors.text,
    textAlign: "center",
  },
  emptyHeroSub: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    color: theme.colors.textSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  emptyHeroBtnText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.onPrimary,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    marginBottom: 4,
  },
  insightTextCol: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: theme.colors.text,
  },
  insightBody: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSoft,
  },
  sectionTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMutedOnDark,
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricTile: {
    width: "47%",
    flexGrow: 1,
    minWidth: "45%",
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
  },
  metricValue: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: theme.colors.text,
  },
  metricLabel: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 12,
    color: theme.colors.textSoft,
  },
  carouselHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 2,
  },
  sectionTitleCarousel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: theme.colors.text,
  },
  carouselLink: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    color: theme.colors.primary,
  },
  carouselSub: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
    color: theme.colors.textMutedOnDark,
    marginBottom: 8,
  },
  carouselLoading: {
    paddingVertical: 24,
    alignItems: "center",
  },
  carouselEmpty: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    color: theme.colors.textSoft,
    lineHeight: 20,
    paddingVertical: 8,
  },
  carouselList: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  readCard: {
    width: 108,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  readCardTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
    lineHeight: 17,
    color: theme.colors.text,
  },
  readCardAuthor: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 11,
    color: theme.colors.textSoft,
  },
  readCardDate: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 2,
  },
});
