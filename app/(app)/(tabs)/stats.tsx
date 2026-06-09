// Panel de estadísticas de lectura (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  HStack,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import type { PropsWithChildren } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/features/auth/use-auth";
import { useBooksFeed, useBooksSummary } from "@/features/books/use-books";
import { useBillingStatus } from "@/features/billing/use-billing";
import {
  useReadingSessionsList,
  useReadingStats,
} from "@/features/readingSessions/use-history";
import { usePurchases } from "@/features/wishlist/use-wishlist";
import { formatApiError } from "@/shared/lib/format-api-error";
import { defaultLibraryBooksQuery } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Screen } from "@/shared/ui/screen";

const isWeb = Platform.OS === "web";

function StatsCard({
  children,
  hero,
}: PropsWithChildren<{ hero?: boolean }>) {
  return (
    <Box
      borderRadius="$xl"
      bg="$white"
      borderWidth={1}
      borderColor="$primary200"
      p="$4"
      mb={hero ? "$2" : "$3"}
    >
      {children}
    </Box>
  );
}

function PanelTitle({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <HStack space="sm" alignItems="center" mb="$2">
      <Ionicons name={icon} size={isWeb ? 16 : 18} color="#A87D42" />
      <Text size={isWeb ? "md" : "lg"} fontWeight="$bold" color="$primary800">
        {title}
      </Text>
    </HStack>
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
  return (
    <Box
      width="48%"
      flexGrow={1}
      minWidth="45%"
      borderRadius="$lg"
      bg="$primary50"
      borderWidth={isWeb ? 0 : 0}
      borderBottomWidth={isWeb ? 1 : 0}
      borderBottomColor="$primary200"
      py="$2"
      px="$2"
    >
      <HStack space="xs" alignItems="center" mb="$0.5">
        <Ionicons name={icon} size={isWeb ? 13 : 15} color="#7A6555" />
        <Text size="xs" color="$textLight500">
          {label}
        </Text>
      </HStack>
      <Text size={isWeb ? "xl" : "2xl"} fontWeight="$bold" color="$primary800">
        {value}
      </Text>
    </Box>
  );
}

function GenreBars({ items }: { items: { genre: string; count: number }[] }) {
  const total = items.reduce((acc, item) => acc + item.count, 0);
  if (total === 0) return null;

  return (
    <VStack space="sm">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <HStack key={item.genre} alignItems="center" space="sm" py="$1">
            <Text width={96} size="sm" fontWeight="$bold" color="$primary800" numberOfLines={1}>
              {item.genre}
            </Text>
            <Box flex={1} h={12} borderRadius="$full" bg="$primary100" overflow="hidden">
              <Box h="100%" borderRadius="$full" bg="$primary500" width={`${Math.max(6, pct)}%`} />
            </Box>
            <Text width={36} textAlign="right" size="xs" fontWeight="$bold" color="$textLight500">
              {pct}%
            </Text>
          </HStack>
        );
      })}
    </VStack>
  );
}

function GenrePills({ items }: { items: { genre: string; count: number }[] }) {
  const total = items.reduce((acc, item) => acc + item.count, 0);
  if (total === 0) return null;

  return (
    <HStack flexWrap="wrap" gap={10}>
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <HStack
            key={item.genre}
            alignItems="center"
            maxWidth="100%"
            gap={8}
            py="$2"
            px="$3"
            borderRadius="$full"
            bg="$primary50"
          >
            <Text flexShrink={1} size="sm" color="$primary800" numberOfLines={1} textTransform="capitalize">
              {item.genre}
            </Text>
            <Box borderRadius="$full" py="$0.5" px="$2" bg="$white">
              <Text size="sm" fontWeight="$bold" color="$primary600">
                {pct}%
              </Text>
            </Box>
          </HStack>
        );
      })}
    </HStack>
  );
}

export default function StatsScreen() {
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
    const hint = formatApiError(billing.error);
    return (
      <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
        <EmptyState title="No se pudo cargar tu plan" description={hint} />
      </Screen>
    );
  }

  if (!billing.data) {
    return <AppLoader />;
  }

  if (stats.isError || summary.isError || purchases.isError || sessions.isError) {
    return (
      <Screen backgroundColor="#F6F1E7" webBackgroundColor="#F6F1E7">
        <EmptyState
          title="No se pudieron cargar las estadisticas"
          description="Intenta recargar la app o revisa la conexion."
        />
      </Screen>
    );
  }

  const genreTop = (summary.data?.genres ?? []).slice(0, 5);
  const now = new Date();
  const chartYear = now.getFullYear();
  const dayOfYear = Math.max(
    1,
    Math.floor(
      (now.getTime() - new Date(chartYear, 0, 1).getTime()) / 86_400_000,
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
        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === chartYear &&
          date.getMonth() + 1 === month
        );
      }) ?? [];
    return {
      sessions: monthSessions.length,
      pages: monthSessions.reduce(
        (acc, item) => acc + Math.max(0, item.pagesRead ?? 0),
        0,
      ),
    };
  });
  const maxReadingSessions = Math.max(...readingByMonth.map((item) => item.sessions), 1);

  const purchasesByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthPurchases =
      purchases.data?.filter((item) => {
        const date = new Date(item.purchasedAt);
        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === chartYear &&
          date.getMonth() + 1 === month
        );
      }) ?? [];

    const amount = monthPurchases.reduce((acc, item) => {
      const parsed = Number.parseFloat(
        (item.price ?? "").replace(",", ".").replace(/[^\d.]/g, ""),
      );
      return Number.isFinite(parsed) ? acc + parsed : acc;
    }, 0);

    return { count: monthPurchases.length, amount };
  });
  const yearlyPurchaseAmount = purchasesByMonth.reduce((acc, item) => acc + item.amount, 0);

  const topRatedBooks = (
    topRatedFeed.data?.pages.flatMap((page) => page.items) ?? []
  )
    .filter((book) => (book.rating ?? 0) > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const rhythmMetrics = [
    { label: "Páginas/sesión", value: pagesPerSession.toFixed(1) },
    { label: "Sesiones/mes", value: sessionsPerMonth.toFixed(1) },
    { label: "Páginas/día", value: pagesPerDay.toFixed(1) },
    { label: "Proyección anual", value: String(yearlyPagesProjection) },
  ];

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{ paddingTop: isWeb ? 10 : 12 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isWeb ? 24 : 32,
          paddingHorizontal: isWeb ? 0 : 2,
          gap: isWeb ? 10 : 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <StatsCard hero>
          <PanelTitle title="Resumen de lectura" icon="stats-chart" />
          <Text size="sm" color="$textLight500" mb="$3">
            Tu progreso global de este año.
          </Text>
          <HStack flexWrap="wrap" gap={10}>
            <MetricPill label="Racha actual" value={stats.data?.currentStreak ?? 0} icon="flame-outline" />
            <MetricPill label="Mejor racha" value={stats.data?.bestStreak ?? 0} icon="trophy-outline" />
            <MetricPill label="Páginas" value={stats.data?.yearlyPages ?? 0} icon="book-outline" />
            <MetricPill label="Sesiones" value={stats.data?.yearlySessions ?? 0} icon="time-outline" />
            <MetricPill label="Leídos" value={summary.data?.leido ?? 0} icon="checkmark-done-outline" />
            <MetricPill label="Leyendo" value={summary.data?.leyendo ?? 0} icon="bookmark-outline" />
            <MetricPill label="Comprados" value={purchases.data?.length ?? 0} icon="bag-handle-outline" />
          </HStack>
        </StatsCard>

        <StatsCard>
          <PanelTitle title="Ritmo de lectura" icon="speedometer-outline" />
          <HStack flexWrap="wrap" gap={10} mt="$1">
            {rhythmMetrics.map((m) => (
              <Box
                key={m.label}
                width="48%"
                flexGrow={1}
                minWidth="45%"
                borderRadius="$lg"
                bg="$primary50"
                p="$3"
                gap={4}
              >
                <Text size="xs" color="$textLight500">
                  {m.label}
                </Text>
                <Text size="xl" fontWeight="$bold" color="$primary800">
                  {m.value}
                </Text>
              </Box>
            ))}
          </HStack>
        </StatsCard>

        <StatsCard>
          <HStack alignItems="center" space="sm" mb="$3">
            <Box flex={1} h={1} bg="$primary200" />
            <Text size="xs" fontWeight="$bold" color="$primary800" letterSpacing={1}>
              GÉNEROS FAVORITOS
            </Text>
            <Box flex={1} h={1} bg="$primary200" />
          </HStack>
          {genreTop.length === 0 ? (
            <Text size="sm" color="$textLight500">
              Sin datos de géneros todavía.
            </Text>
          ) : isWeb ? (
            <GenreBars items={genreTop} />
          ) : (
            <GenrePills items={genreTop} />
          )}
        </StatsCard>

        <StatsCard>
          <PanelTitle title="Top 5 libros por valoración" icon="star-outline" />
          {topRatedBooks.length === 0 ? (
            <Text size="sm" color="$textLight500">
              Aún no hay libros valorados.
            </Text>
          ) : (
            <VStack space="sm">
              {topRatedBooks.map((book, index) => (
                <HStack
                  key={book.id}
                  alignItems="center"
                  space="sm"
                  py="$2"
                  px="$3"
                  borderRadius="$lg"
                  bg="$primary50"
                >
                  <Text width={22} size="sm" fontWeight="$bold" color="$textLight500">
                    {index + 1}.
                  </Text>
                  <Text flex={1} size="sm" color="$primary800" numberOfLines={1}>
                    {book.title}
                  </Text>
                  <HStack alignItems="center" space="xs" minWidth={42}>
                    <Ionicons name="star" size={12} color="#C4A35A" />
                    <Text size="sm" fontWeight="$bold" color="#C4A35A">
                      {(book.rating ?? 0).toFixed(1)}
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}
        </StatsCard>

        <StatsCard>
          <PanelTitle title="Actividad de lectura por mes" icon="bar-chart-outline" />
          <VStack space="sm" mt="$1">
            {readingByMonth.map((item, index) => (
              <HStack key={`read-${index}`} alignItems="center" space="sm" py="$1">
                <Text
                  width={38}
                  size="xs"
                  color="$textLight500"
                  textTransform="capitalize"
                >
                  {monthFormatter.format(new Date(chartYear, index, 1))}
                </Text>
                <Box flex={1} h={12} borderRadius="$full" bg="$primary100" overflow="hidden">
                  <Box
                    h="100%"
                    borderRadius="$full"
                    bg="#C4A35A"
                    width={`${Math.max(8, (item.sessions / maxReadingSessions) * 100)}%`}
                  />
                </Box>
                <Text width={28} textAlign="right" size="sm" fontWeight="$bold" color="$primary800">
                  {item.sessions}
                </Text>
                <Text width={48} textAlign="right" size="xs" fontWeight="$bold" color="$primary800">
                  {item.pages}p
                </Text>
              </HStack>
            ))}
          </VStack>
        </StatsCard>

        <StatsCard>
          <PanelTitle title="Compras por mes" icon="cart-outline" />
          <Text size="xs" color="$textLight500" mb="$3">
            Total estimado anual: {moneyFormatter.format(yearlyPurchaseAmount)}
          </Text>
          <VStack space="sm">
            {purchasesByMonth.map((item, index) => (
              <HStack
                key={`purchase-${index}`}
                alignItems="center"
                justifyContent="space-between"
                borderRadius="$lg"
                bg="$primary50"
                py="$3"
                px="$3"
              >
                <Box borderRadius="$full" bg="$white" py="$1" px="$3">
                  <Text size="xs" color="$primary800" textTransform="capitalize">
                    {monthFormatter.format(new Date(chartYear, index, 1))}
                  </Text>
                </Box>
                <HStack alignItems="center" space="md">
                  <HStack alignItems="center" space="xs">
                    <Ionicons name="bag-handle-outline" size={13} color="#A87D42" />
                    <Text size="sm" fontWeight="$bold" color="$primary800">
                      {item.count}
                    </Text>
                  </HStack>
                  <Text size="sm" fontWeight="$bold" color="$primary600" minWidth={64} textAlign="right">
                    {moneyFormatter.format(item.amount)}
                  </Text>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </StatsCard>
      </ScrollView>
    </Screen>
  );
}
