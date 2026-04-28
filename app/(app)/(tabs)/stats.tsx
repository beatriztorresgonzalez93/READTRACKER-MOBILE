import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";

import { useBooksSummary } from "@/features/books/use-books";
import { useReadingSessionsList, useReadingStats } from "@/features/readingSessions/use-history";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </Card.Content>
    </Card>
  );
}

export default function StatsScreen() {
  const stats = useReadingStats();
  const sessions = useReadingSessionsList();
  const summary = useBooksSummary();
  const purchases = usePurchases();

  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "short" });
  const moneyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

  if (stats.isLoading && !stats.data && summary.isLoading && !summary.data) {
    return <AppLoader />;
  }

  if (stats.isError || summary.isError || purchases.isError || sessions.isError) {
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
    Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000) + 1,
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
      pages: monthSessions.reduce((acc, item) => acc + Math.max(0, item.pagesRead ?? 0), 0),
    };
  });
  const maxReadingSessions = Math.max(...readingByMonth.map((item) => item.sessions), 1);

  const purchasesByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthPurchases =
      purchases.data?.filter((item) => {
        const date = new Date(item.purchasedAt);
        return !Number.isNaN(date.getTime()) && date.getMonth() + 1 === month;
      }) ?? [];

    const amount = monthPurchases.reduce((acc, item) => {
      const parsed = Number.parseFloat((item.price ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
      return Number.isFinite(parsed) ? acc + parsed : acc;
    }, 0);

    return {
      count: monthPurchases.length,
      amount,
    };
  });
  const maxPurchaseCount = Math.max(...purchasesByMonth.map((item) => item.count), 1);
  const yearlyPurchaseAmount = purchasesByMonth.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <StatCard label="Racha actual" value={stats.data?.currentStreak ?? 0} />
          <StatCard label="Mejor racha" value={stats.data?.bestStreak ?? 0} />
          <StatCard label="Paginas este ano" value={stats.data?.yearlyPages ?? 0} />
          <StatCard label="Sesiones este ano" value={stats.data?.yearlySessions ?? 0} />
          <StatCard
            label="Promedio minutos/sesion"
            value={Math.round(stats.data?.averageMinutesPerSession ?? 0)}
          />
          <StatCard label="Libros totales" value={summary.data?.total ?? 0} />
          <StatCard label="Leidos" value={summary.data?.leido ?? 0} />
          <StatCard label="Leyendo" value={summary.data?.leyendo ?? 0} />
          <StatCard label="Comprados" value={purchases.data?.length ?? 0} />
        </View>
        <Card mode="outlined" style={styles.panel}>
          <Card.Content>
          <Text style={styles.panelTitle}>Top generos</Text>
          {genreTop.length === 0 ? (
            <Text style={styles.panelText}>Sin datos de generos todavia.</Text>
          ) : (
            genreTop.map((item) => (
              <Text key={item.genre} style={styles.panelText}>
                {item.genre}: {item.count}
              </Text>
            ))
          )}
          </Card.Content>
        </Card>
        <Card mode="outlined" style={styles.panel}>
          <Card.Content>
          <Text style={styles.panelTitle}>Ritmo de lectura</Text>
          <View style={styles.rhythmGrid}>
            <View style={styles.rhythmCard}>
              <Text style={styles.rhythmLabel}>Paginas/sesion</Text>
              <Text style={styles.rhythmValue}>{pagesPerSession.toFixed(1)}</Text>
            </View>
            <View style={styles.rhythmCard}>
              <Text style={styles.rhythmLabel}>Sesiones/mes</Text>
              <Text style={styles.rhythmValue}>{sessionsPerMonth.toFixed(1)}</Text>
            </View>
            <View style={styles.rhythmCard}>
              <Text style={styles.rhythmLabel}>Paginas/dia</Text>
              <Text style={styles.rhythmValue}>{pagesPerDay.toFixed(1)}</Text>
            </View>
            <View style={styles.rhythmCard}>
              <Text style={styles.rhythmLabel}>Proyeccion anual</Text>
              <Text style={styles.rhythmValue}>{yearlyPagesProjection}</Text>
            </View>
          </View>
          </Card.Content>
        </Card>
        <Card mode="outlined" style={styles.panel}>
          <Card.Content>
          <Text style={styles.panelTitle}>Actividad de lectura por mes</Text>
          {readingByMonth.map((item, index) => (
            <View key={`read-${index}`} style={styles.barRow}>
              <Text style={styles.barLabel}>{monthFormatter.format(new Date(2026, index, 1))}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillReading,
                    {
                      width: `${Math.max(8, (item.sessions / maxReadingSessions) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{item.sessions}</Text>
              <Text style={styles.barAmount}>{item.pages}p</Text>
            </View>
          ))}
          </Card.Content>
        </Card>
        <Card mode="outlined" style={styles.panel}>
          <Card.Content>
          <Text style={styles.panelTitle}>Compras por mes</Text>
          <Text style={styles.panelSubtitle}>Total estimado anual: {moneyFormatter.format(yearlyPurchaseAmount)}</Text>
          {purchasesByMonth.map((item, index) => (
            <View key={`m-${index}`} style={styles.barRow}>
              <Text style={styles.barLabel}>{monthFormatter.format(new Date(2026, index, 1))}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(8, (item.count / maxPurchaseCount) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{item.count}</Text>
              <Text style={styles.barAmount}>{moneyFormatter.format(item.amount)}</Text>
            </View>
          ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 24,
  },
  grid: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  cardLabel: {
    color: theme.colors.textSoft,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: "800",
  },
  panel: {
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: 10,
  },
  panelTitle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  panelText: {
    color: theme.colors.textSoft,
  },
  panelSubtitle: {
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  rhythmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rhythmCard: {
    width: "48%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    gap: 2,
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
});

