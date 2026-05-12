// Panel de estadisticas de lectura y progreso global.
import { Ionicons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Card } from "react-native-paper";

import { useAuth } from "@/features/auth/use-auth";
import { useBooksFeed, useBooksSummary } from "@/features/books/use-books";
import { useBillingStatus } from "@/features/billing/use-billing";
import {
    useReadingSessionsList,
    useReadingStats,
} from "@/features/readingSessions/use-history";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { defaultLibraryBooksQuery } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

function StatsPanel({
  isDark,
  variant,
  children,
}: PropsWithChildren<{
  isDark: boolean;
  variant: "hero" | "default";
}>) {
  const webStyle = variant === "hero" ? styles.heroPanel : styles.panel;
  if (Platform.OS === "web") {
    return (
      <Card
        mode="contained"
        style={[webStyle, isDark && styles.panelDarkMode]}
      >
        <Card.Content>{children}</Card.Content>
      </Card>
    );
  }
  return (
    <View
      style={[
        styles.nativePanelOuter,
        isDark && styles.panelDarkMode,
      ]}
    >
      <View style={styles.nativePanelPadding}>{children}</View>
    </View>
  );
}

function MetricPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const isWeb = Platform.OS === "web";
  return (
    <View style={[styles.metricPill, !isWeb && styles.metricPillNative]}>
      <View style={styles.metricPillHeader}>
        <Ionicons
          name={icon}
          size={isWeb ? 13 : 15}
          color={theme.colors.textSoft}
        />
        <Text
          style={[styles.metricPillLabel, !isWeb && styles.metricPillLabelNative]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[styles.metricPillValue, !isWeb && styles.metricPillValueNative]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const isDark = useColorScheme() !== "light";
  const { token, isAuthenticated, isBootstrapping } = useAuth();
  const billing = useBillingStatus();
  const billingCanFetch = !isBootstrapping && isAuthenticated && Boolean(token?.trim());
  const stats = useReadingStats();
  const sessions = useReadingSessionsList();
  const summary = useBooksSummary();
  const topRatedFeed = useBooksFeed({
    ...defaultLibraryBooksQuery,
    sort: "valoracion",
  });
  const purchases = usePurchases();

  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "short" });
  const moneyFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  if (
    !billingCanFetch ||
    (billingCanFetch && billing.status !== "success" && billing.status !== "error") ||
    (billing.isLoading || (stats.isLoading && !stats.data && summary.isLoading && !summary.data))
  ) {
    return <AppLoader />;
  }

  if (billing.status === "error") {
    const hint =
      billing.error instanceof Error
        ? billing.error.message
        : "Revisa la conexión e inténtalo de nuevo.";
    return (
      <Screen>
        <EmptyState
          title="No se pudo cargar tu plan"
          description={hint}
        />
      </Screen>
    );
  }

  if (!billing.data) {
    return <AppLoader />;
  }

  if (
    stats.isError ||
    summary.isError ||
    purchases.isError ||
    sessions.isError
  ) {
    return (
      <Screen>
        <EmptyState
          title="No se pudieron cargar las estadisticas"
          description="Intenta recargar la app o revisa la conexion."
        />
      </Screen>
    );
  }

  const genreTop = (summary.data?.genres ?? []).slice(0, 5);
  const now = new Date();
  const dayOfYear = Math.max(
    1,
    Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
        86_400_000,
    ) + 1,
  );
  const monthsElapsed = Math.max(1, now.getMonth() + 1);
  const pagesPerSession =
    (stats.data?.yearlySessions ?? 0) > 0
      ? (stats.data?.yearlyPages ?? 0) / (stats.data?.yearlySessions ?? 1)
      : 0;
  const sessionsPerMonth = (stats.data?.yearlySessions ?? 0) / monthsElapsed;
  const pagesPerDay = (stats.data?.yearlyPages ?? 0) / dayOfYear;
  const yearlyPagesProjection = Math.round(pagesPerDay * 365);
  const readingByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthSessions =
      sessions.data?.filter((item) => {
        const date = new Date(item.recordedAt);
        return !Number.isNaN(date.getTime()) && date.getMonth() + 1 === month;
      }) ?? [];
    return {
      sessions: monthSessions.length,
      pages: monthSessions.reduce(
        (acc, item) => acc + Math.max(0, item.pagesRead ?? 0),
        0,
      ),
    };
  });
  const maxReadingSessions = Math.max(
    ...readingByMonth.map((item) => item.sessions),
    1,
  );

  const purchasesByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthPurchases =
      purchases.data?.filter((item) => {
        const date = new Date(item.purchasedAt);
        return !Number.isNaN(date.getTime()) && date.getMonth() + 1 === month;
      }) ?? [];

    const amount = monthPurchases.reduce((acc, item) => {
      const parsed = Number.parseFloat(
        (item.price ?? "").replace(",", ".").replace(/[^\d.]/g, ""),
      );
      return Number.isFinite(parsed) ? acc + parsed : acc;
    }, 0);

    return {
      count: monthPurchases.length,
      amount,
    };
  });
  const yearlyPurchaseAmount = purchasesByMonth.reduce(
    (acc, item) => acc + item.amount,
    0,
  );
  const topRatedBooks = (
    topRatedFeed.data?.pages.flatMap((page) => page.items) ?? []
  )
    .filter((book) => (book.rating ?? 0) > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      style={[styles.screen, Platform.OS !== "web" && styles.screenNative]}
    >
      <ScrollView
        contentContainerStyle={
          Platform.OS === "web"
            ? styles.contentContainer
            : styles.contentContainerNative
        }
        showsVerticalScrollIndicator={false}
      >
        <StatsPanel isDark={isDark} variant="hero">
            <View
              style={[
                styles.titleRow,
                Platform.OS !== "web" && styles.titleRowNative,
              ]}
            >
              <Ionicons
                name="stats-chart"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.heroTitle,
                  Platform.OS !== "web" && styles.heroTitleNative,
                ]}
              >
                Resumen de lectura
              </Text>
            </View>
            <Text
              style={[
                styles.heroSubtitle,
                Platform.OS !== "web" && styles.heroSubtitleNative,
              ]}
            >
              Tu progreso global de este año.
            </Text>
            <View
              style={[
                styles.metricPillsRow,
                Platform.OS !== "web" && styles.metricPillsRowNative,
              ]}
            >
              <MetricPill
                label="Racha actual"
                value={stats.data?.currentStreak ?? 0}
                icon="flame-outline"
              />
              <MetricPill
                label="Mejor racha"
                value={stats.data?.bestStreak ?? 0}
                icon="trophy-outline"
              />
              <MetricPill
                label="Páginas"
                value={stats.data?.yearlyPages ?? 0}
                icon="book-outline"
              />
              <MetricPill
                label="Sesiones"
                value={stats.data?.yearlySessions ?? 0}
                icon="time-outline"
              />
              <MetricPill
                label="Leídos"
                value={summary.data?.leido ?? 0}
                icon="checkmark-done-outline"
              />
              <MetricPill
                label="Leyendo"
                value={summary.data?.leyendo ?? 0}
                icon="bookmark-outline"
              />
              <MetricPill
                label="Comprados"
                value={purchases.data?.length ?? 0}
                icon="bag-handle-outline"
              />
            </View>
        </StatsPanel>

        <StatsPanel isDark={isDark} variant="default">
            <View
              style={[
                styles.titleRow,
                Platform.OS !== "web" && styles.titleRowNative,
              ]}
            >
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.panelTitle,
                  Platform.OS !== "web" && styles.panelTitleNative,
                ]}
              >
                Ritmo de lectura
              </Text>
            </View>
            <View
              style={[
                styles.rhythmGrid,
                Platform.OS !== "web" && styles.rhythmGridNative,
              ]}
            >
              <View
                style={[
                  styles.rhythmCard,
                  isDark && styles.innerCardDarkMode,
                  Platform.OS !== "web" && styles.rhythmCardNative,
                ]}
              >
                <Text
                  style={[
                    styles.rhythmLabel,
                    Platform.OS !== "web" && styles.rhythmLabelNative,
                  ]}
                >
                  Páginas/sesión
                </Text>
                <Text
                  style={[
                    styles.rhythmValue,
                    Platform.OS !== "web" && styles.rhythmValueNative,
                  ]}
                >
                  {pagesPerSession.toFixed(1)}
                </Text>
              </View>
              <View
                style={[
                  styles.rhythmCard,
                  isDark && styles.innerCardDarkMode,
                  Platform.OS !== "web" && styles.rhythmCardNative,
                ]}
              >
                <Text
                  style={[
                    styles.rhythmLabel,
                    Platform.OS !== "web" && styles.rhythmLabelNative,
                  ]}
                >
                  Sesiones/mes
                </Text>
                <Text
                  style={[
                    styles.rhythmValue,
                    Platform.OS !== "web" && styles.rhythmValueNative,
                  ]}
                >
                  {sessionsPerMonth.toFixed(1)}
                </Text>
              </View>
              <View
                style={[
                  styles.rhythmCard,
                  isDark && styles.innerCardDarkMode,
                  Platform.OS !== "web" && styles.rhythmCardNative,
                ]}
              >
                <Text
                  style={[
                    styles.rhythmLabel,
                    Platform.OS !== "web" && styles.rhythmLabelNative,
                  ]}
                >
                  Páginas/día
                </Text>
                <Text
                  style={[
                    styles.rhythmValue,
                    Platform.OS !== "web" && styles.rhythmValueNative,
                  ]}
                >
                  {pagesPerDay.toFixed(1)}
                </Text>
              </View>
              <View
                style={[
                  styles.rhythmCard,
                  isDark && styles.innerCardDarkMode,
                  Platform.OS !== "web" && styles.rhythmCardNative,
                ]}
              >
                <Text
                  style={[
                    styles.rhythmLabel,
                    Platform.OS !== "web" && styles.rhythmLabelNative,
                  ]}
                >
                  Proyección anual
                </Text>
                <Text
                  style={[
                    styles.rhythmValue,
                    Platform.OS !== "web" && styles.rhythmValueNative,
                  ]}
                >
                  {yearlyPagesProjection}
                </Text>
              </View>
            </View>
        </StatsPanel>

        <StatsPanel isDark={isDark} variant="default">
            <View
              style={[
                styles.genreHeaderRow,
                Platform.OS !== "web" && styles.genreHeaderRowNative,
              ]}
            >
              <View style={styles.genreHeaderLine} />
              <Text
                style={[
                  styles.genreHeaderTitle,
                  Platform.OS !== "web" && styles.genreHeaderTitleNative,
                ]}
              >
                ✦ GÉNEROS FAVORITOS
              </Text>
              <View style={styles.genreHeaderLine} />
            </View>
            {genreTop.length === 0 ? (
              <Text
                style={[
                  styles.panelText,
                  Platform.OS !== "web" && styles.panelTextNative,
                ]}
              >
                Sin datos de géneros todavía.
              </Text>
            ) : Platform.OS === "web" ? (
              (() => {
                const totalGenres = genreTop.reduce(
                  (acc, item) => acc + item.count,
                  0,
                );
                return genreTop.map((item, index) => {
                  const pct =
                    totalGenres > 0
                      ? Math.round((item.count / totalGenres) * 100)
                      : 0;
                  return (
                    <View
                      key={item.genre}
                      style={[
                        styles.genreRow,
                        index === genreTop.length - 1 && styles.genreRowLast,
                      ]}
                    >
                      <Text
                        style={styles.genreLabel}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.genre}
                      </Text>
                      <View style={styles.genreTrack}>
                        <View
                          style={[
                            styles.genreFill,
                            { width: `${Math.max(6, pct)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.genrePct}>{pct}%</Text>
                    </View>
                  );
                });
              })()
            ) : (
              (() => {
                const totalGenres = genreTop.reduce(
                  (acc, item) => acc + item.count,
                  0,
                );
                return (
                  <View style={styles.genrePillsWrap}>
                    {genreTop.map((item) => {
                      const pct =
                        totalGenres > 0
                          ? Math.round((item.count / totalGenres) * 100)
                          : 0;
                      return (
                        <View key={item.genre} style={styles.genrePillNative}>
                          <Text
                            style={styles.genrePillNameNative}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.genre}
                          </Text>
                          <View style={styles.genrePillPctBadge}>
                            <Text style={styles.genrePillPctNative}>{pct}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })()
            )}
        </StatsPanel>

        <StatsPanel isDark={isDark} variant="default">
            <View
              style={[
                styles.titleRow,
                Platform.OS !== "web" && styles.titleRowNative,
              ]}
            >
              <Ionicons
                name="star-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.panelTitle,
                  Platform.OS !== "web" && styles.panelTitleNative,
                ]}
              >
                Top 5 libros por valoración
              </Text>
            </View>
            {topRatedBooks.length === 0 ? (
              <Text
                style={[
                  styles.panelText,
                  Platform.OS !== "web" && styles.panelTextNative,
                ]}
              >
                Aún no hay libros valorados.
              </Text>
            ) : (
              topRatedBooks.map((book, index) => {
                const rowInner = (
                  <>
                    <Text style={styles.rankIndex}>{index + 1}.</Text>
                    <Text
                      style={[
                        styles.rankTitle,
                        Platform.OS !== "web" && styles.rankTitleNative,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {book.title}
                    </Text>
                    <View style={styles.rankScoreWrap}>
                      <Ionicons
                        name="star"
                        size={12}
                        color={theme.colors.accent}
                      />
                      <Text
                        style={[
                          styles.rankScore,
                          Platform.OS !== "web" && styles.rankScoreNative,
                        ]}
                      >
                        {(book.rating ?? 0).toFixed(1)}
                      </Text>
                    </View>
                  </>
                );
                if (Platform.OS === "web") {
                  return (
                    <View key={book.id} style={styles.rankRow}>
                      {rowInner}
                    </View>
                  );
                }
                return (
                  <View key={book.id} style={styles.rankCardNative}>
                    <View style={styles.rankRow}>{rowInner}</View>
                  </View>
                );
              })
            )}
        </StatsPanel>

        <StatsPanel isDark={isDark} variant="default">
            <View
              style={[
                styles.titleRow,
                Platform.OS !== "web" && styles.titleRowNative,
              ]}
            >
              <Ionicons
                name="bar-chart-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.panelTitle,
                  Platform.OS !== "web" && styles.panelTitleNative,
                ]}
              >
                Actividad de lectura por mes
              </Text>
            </View>
            {readingByMonth.map((item, index) => (
              <View
                key={`read-${index}`}
                style={[
                  styles.barRow,
                  Platform.OS !== "web" && styles.barRowNative,
                ]}
              >
                <Text
                  style={[
                    styles.barLabel,
                    Platform.OS !== "web" && styles.barLabelNative,
                  ]}
                >
                  {monthFormatter.format(new Date(2026, index, 1))}
                </Text>
                <View
                  style={[
                    styles.barTrack,
                    Platform.OS !== "web" && styles.barTrackNative,
                  ]}
                >
                  <View
                    style={[
                      styles.barFillReading,
                      {
                        width: `${Math.max(8, (item.sessions / maxReadingSessions) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barValue,
                    Platform.OS !== "web" && styles.barValueNative,
                  ]}
                >
                  {item.sessions}
                </Text>
                <Text
                  style={[
                    styles.barAmount,
                    Platform.OS !== "web" && styles.barAmountNative,
                  ]}
                >
                  {item.pages}p
                </Text>
              </View>
            ))}
        </StatsPanel>

        <StatsPanel isDark={isDark} variant="default">
            <View
              style={[
                styles.titleRow,
                Platform.OS !== "web" && styles.titleRowNative,
              ]}
            >
              <Ionicons
                name="cart-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.panelTitle,
                  Platform.OS !== "web" && styles.panelTitleNative,
                ]}
              >
                Compras por mes
              </Text>
            </View>
            <Text
              style={[
                styles.panelSubtitle,
                Platform.OS !== "web" && styles.panelSubtitleNative,
              ]}
            >
              Total estimado anual:{" "}
              {moneyFormatter.format(yearlyPurchaseAmount)}
            </Text>
            {purchasesByMonth.map((item, index) => (
              <View
                key={`m-${index}`}
                style={[
                  styles.purchaseRow,
                  isDark && styles.innerCardDarkMode,
                  Platform.OS !== "web" && styles.purchaseRowNative,
                ]}
              >
                <View
                  style={[
                    styles.purchaseMonthPill,
                    isDark && styles.purchaseMonthPillDarkMode,
                    Platform.OS !== "web" && styles.purchaseMonthPillNative,
                  ]}
                >
                  <Text
                    style={[
                      styles.purchaseMonthText,
                      Platform.OS !== "web" && styles.purchaseMonthTextNative,
                    ]}
                  >
                    {monthFormatter.format(new Date(2026, index, 1))}
                  </Text>
                </View>
                <View style={styles.purchaseMeta}>
                  <View style={styles.purchaseCountWrap}>
                    <Ionicons
                      name="bag-handle-outline"
                      size={13}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.purchaseCount,
                        Platform.OS !== "web" && styles.purchaseCountNative,
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.purchaseAmount,
                      Platform.OS !== "web" && styles.purchaseAmountNative,
                    ]}
                  >
                    {moneyFormatter.format(item.amount)}
                  </Text>
                </View>
              </View>
            ))}
        </StatsPanel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 10,
  },
  contentContainer: {
    paddingBottom: 24,
    gap: 10,
  },
  contentContainerNative: {
    paddingBottom: 32,
    gap: 20,
    paddingHorizontal: 2,
  },
  screenNative: {
    paddingTop: 12,
  },
  nativePanelOuter: {
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
  },
  nativePanelPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroPanel: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "hidden",
    elevation: 0,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  heroTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  titleRowNative: {
    marginBottom: 8,
  },
  heroSubtitle: {
    color: theme.colors.textSoft,
    marginTop: 2,
    marginBottom: 10,
  },
  metricPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
    columnGap: 10,
  },
  metricPill: {
    width: "48%",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  metricPillValue: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 19,
  },
  metricPillLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
    marginBottom: 1,
  },
  metricPillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  panel: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "hidden",
    elevation: 0,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  panelDarkMode: {
    backgroundColor: "rgba(244, 233, 212, 0.78)",
    shadowOpacity: 0.015,
  },
  panelTitle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  panelText: {
    color: theme.colors.textSoft,
  },
  genreHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  genreHeaderRowNative: {
    marginBottom: 14,
  },
  genreHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  genreHeaderTitle: {
    color: theme.colors.text,
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 12,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  genreRowLast: {
    paddingBottom: 2,
  },
  genreLabel: {
    width: 96,
    color: theme.colors.text,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  genreTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.bgSoft,
    overflow: "hidden",
  },
  genreFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  genrePct: {
    width: 36,
    textAlign: "right",
    color: theme.colors.textSoft,
    fontWeight: "700",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  rankIndex: {
    width: 22,
    color: theme.colors.textSoft,
    fontWeight: "700",
  },
  rankTitle: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: "600",
  },
  rankScore: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  rankScoreWrap: {
    minWidth: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  panelSubtitle: {
    color: theme.colors.textSoft,
    fontSize: 12,
    marginBottom: 8,
  },
  rhythmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rhythmGridNative: {
    gap: 12,
  },
  rhythmCard: {
    width: "48%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 0,
    borderColor: "transparent",
    padding: 10,
    gap: 2,
  },
  innerCardDarkMode: {
    backgroundColor: "rgba(244, 233, 212, 0.52)",
    borderColor: "transparent",
  },
  rhythmLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  rhythmValue: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    width: 34,
    color: theme.colors.textSoft,
    fontSize: 12,
    textTransform: "capitalize",
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.bgSoft,
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  barFillReading: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
  },
  barValue: {
    width: 16,
    textAlign: "right",
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  barAmount: {
    width: 64,
    textAlign: "right",
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 11,
  },
  purchaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgSoft,
  },
  purchaseMonthPill: {
    minWidth: 44,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.card,
  },
  purchaseMonthPillDarkMode: {
    backgroundColor: "rgba(255, 252, 245, 0.66)",
  },
  purchaseMonthText: {
    color: theme.colors.text,
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "600",
  },
  purchaseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  purchaseCountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  purchaseCount: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  purchaseAmount: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 64,
    textAlign: "right",
  },
  heroTitleNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    fontWeight: "700",
  },
  heroSubtitleNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  panelTitleNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    fontWeight: "700",
  },
  panelTextNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  panelSubtitleNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  genreHeaderTitleNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  metricPillsRowNative: {
    rowGap: 10,
    columnGap: 10,
  },
  metricPillNative: {
    borderBottomWidth: 0,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.bgSoft,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  metricPillLabelNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
  },
  metricPillValueNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  rhythmCardNative: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  rhythmLabelNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
  },
  rhythmValueNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  genrePillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  genrePillNative: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  genrePillNameNative: {
    flexShrink: 1,
    color: theme.colors.text,
    fontFamily: "Fraunces_400Regular",
    fontSize: 14,
    textTransform: "capitalize",
  },
  genrePillPctBadge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.card,
  },
  genrePillPctNative: {
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    fontWeight: "700",
  },
  rankCardNative: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: theme.colors.bgSoft,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  rankTitleNative: {
    fontFamily: "Fraunces_400Regular",
    fontWeight: "400",
  },
  rankScoreNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  barRowNative: {
    marginBottom: 10,
    paddingVertical: 4,
  },
  barLabelNative: {
    fontFamily: "Fraunces_400Regular",
    width: 38,
    fontSize: 13,
  },
  barTrackNative: {
    height: 12,
  },
  barValueNative: {
    fontFamily: "Fraunces_700Bold",
    width: 28,
    fontSize: 17,
    fontWeight: "700",
  },
  barAmountNative: {
    fontFamily: "Fraunces_700Bold",
    width: 56,
    fontSize: 15,
    fontWeight: "700",
  },
  purchaseRowNative: {
    borderRadius: 16,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  purchaseMonthPillNative: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  purchaseMonthTextNative: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 13,
  },
  purchaseCountNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
  },
  purchaseAmountNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
});
