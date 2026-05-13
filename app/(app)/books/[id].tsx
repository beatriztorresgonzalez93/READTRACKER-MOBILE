// Detalle de libro con progreso, resena, etiquetas y acciones.
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { createElement, type ChangeEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Card, Chip, Text } from "react-native-paper";

import {
  useBookDetail,
  useBooksFeed,
  useCreateReadingSession,
  useDeleteBook,
  useUpdateBook,
  useUpdateBookStatus,
} from "@/features/books/use-books";
import {
  buildReadingSessionPayload,
  calculateCompletion,
  parseNextPageInput,
} from "@/features/books/lib/mark-page";
import { useReadingSessionsList } from "@/features/readingSessions/use-history";
import { defaultLibraryBooksQuery } from "@/shared/types/books";
import { AppLoader } from "@/shared/ui/app-loader";
import { BookCover } from "@/shared/ui/book-cover";
import { Screen } from "@/shared/ui/screen";
import { theme } from "@/shared/ui/theme";

const DETAIL_TABS = ["Información", "Mi reseña", "Similares"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];
const STATUS_OPTIONS = ["pendiente", "leyendo", "leido"] as const;
const TIMES_READ_OPTIONS = [
  "No leido aun",
  "1ª vez",
  "2ª vez",
  "3ª vez",
  "4ª vez",
  "5ª vez o mas",
] as const;

function toTimesReadLabel(count?: number | null): (typeof TIMES_READ_OPTIONS)[number] {
  if (!count || count <= 0) return "No leido aun";
  if (count === 1) return "1ª vez";
  if (count === 2) return "2ª vez";
  if (count === 3) return "3ª vez";
  if (count === 4) return "4ª vez";
  return "5ª vez o mas";
}

function Stars({ rating }: { rating?: number | null }) {
  const value = rating ?? 0;
  const stars = Math.max(
    0,
    Math.min(5, Math.round(value > 5 ? value / 2 : value)),
  );
  return (
    <Text style={styles.stars}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </Text>
  );
}

export default function BookDetailScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Platform.OS === "web" ? Math.min(width, 1120) : width;
  const pagerRef = useRef<ScrollView>(null);
  const reviewScrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = params.id;
  const detailQuery = useBookDetail(bookId);
  const updateStatus = useUpdateBookStatus(bookId);
  const updateBook = useUpdateBook(bookId);
  const createSession = useCreateReadingSession(bookId);
  const sessionsQuery = useReadingSessionsList();
  const deleteBook = useDeleteBook(bookId);
  const [activeTab, setActiveTab] = useState<DetailTab>("Información");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [markPageModalOpen, setMarkPageModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("pendiente");
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewReadAt, setReviewReadAt] = useState("");
  const [reviewReadAtDate, setReviewReadAtDate] = useState<Date>(new Date());
  const [reviewDatePickerOpen, setReviewDatePickerOpen] = useState(false);
  const [reviewTimesRead, setReviewTimesRead] = useState<(typeof TIMES_READ_OPTIONS)[number]>("No leido aun");
  const [timesReadModalOpen, setTimesReadModalOpen] = useState(false);
  const [reviewReadAtDisplay, setReviewReadAtDisplay] = useState<string | null>(null);
  const [reviewTimesReadDisplay, setReviewTimesReadDisplay] = useState<string | null>(
    null,
  );
  const [reviewFavoriteQuote, setReviewFavoriteQuote] = useState("");
  const [reviewRecommendation, setReviewRecommendation] = useState<
    "si" | "depende" | "no" | undefined
  >(undefined);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewTagInput, setReviewTagInput] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [pageHistory, setPageHistory] = useState<
    { page: number; when: string }[]
  >([]);
  const book = detailQuery.data;

  const similarByGenreFeed = useBooksFeed(
    useMemo(
      () => ({
        ...defaultLibraryBooksQuery,
        genre: book?.genre?.trim() ? book.genre : null,
        sort: "recientes" as const,
      }),
      [book?.genre],
    ),
  );

  const similarByTagsFeed = useBooksFeed(
    useMemo(
      () => ({
        ...defaultLibraryBooksQuery,
        genre: null,
        sort: "recientes" as const,
      }),
      [],
    ),
  );

  const similarBooks = useMemo(() => {
    const targetGenre = book?.genre?.toLowerCase().trim();
    const baseTags = new Set(
      (book?.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    );

    const genreCandidates = (similarByGenreFeed.data?.pages.flatMap((p) => p.items) ?? [])
      .filter((candidate) => candidate.id !== bookId)
      .filter((candidate) =>
        targetGenre && candidate.genre
          ? candidate.genre.toLowerCase().trim() === targetGenre
          : false,
      )
      .map((candidate) => ({ book: candidate, reason: "Mismo género" as const }));

    const alreadyIncluded = new Set(genreCandidates.map((entry) => entry.book.id));

    const tagCandidates = (similarByTagsFeed.data?.pages.flatMap((p) => p.items) ?? [])
      .filter((candidate) => candidate.id !== bookId && !alreadyIncluded.has(candidate.id))
      .filter((candidate) =>
        (candidate.tags ?? []).some((tag) =>
          baseTags.has(tag.toLowerCase().trim()),
        ),
      )
      .map((candidate) => ({ book: candidate, reason: "Misma etiqueta" as const }));

    return [...genreCandidates, ...tagCandidates].slice(0, 6);
  }, [book?.genre, book?.tags, bookId, similarByGenreFeed.data?.pages, similarByTagsFeed.data?.pages]);
  const year = book?.publishedYear ? String(book.publishedYear) : "—";
  const reviewText =
    book?.reviewText ?? "Aún no has escrito una reseña para este libro.";
  const canMarkPage = selectedStatus === "leyendo";
  const recommendationValue = (book?.recommendation ?? "").toLowerCase().trim();
  const recommendationLabel =
    recommendationValue === "si"
      ? "👍 Sí, lo recomiendo"
      : recommendationValue === "depende"
        ? "🤔 Depende del lector"
        : recommendationValue === "no"
          ? "👎 No especialmente"
          : "Aún sin recomendación.";
  const totalPages = Math.max(1, book?.pages ?? 1);
  const readAtLabel =
    reviewReadAtDisplay ??
    (book?.readAt || book?.lastPageMarkedAt
      ? new Date(book?.readAt ?? book?.lastPageMarkedAt ?? "").toLocaleDateString("es-ES")
      : "Sin registro");
  const timesReadLabel =
    reviewTimesReadDisplay ??
    (book?.timesRead
      ? book.timesRead
      : book?.readCount
      ? `${book.readCount} vez${book.readCount > 1 ? "es" : ""}`
      : "No leido aun");
  const completion = calculateCompletion(currentPage, totalPages);
  const bookSessions = useMemo(
    () =>
      (sessionsQuery.data ?? [])
        .filter((session) => session.bookId === bookId)
        .sort(
          (a, b) =>
            Date.parse(b.recordedAt || b.createdAt) -
            Date.parse(a.recordedAt || a.createdAt),
        ),
    [sessionsQuery.data, bookId],
  );
  const latestBookSession = bookSessions[0];

  useLayoutEffect(() => {
    if (Platform.OS === "web") return;
    const raw = book?.title?.trim() ?? "";
    const title =
      raw.length === 0 ? "Libro" : raw.length > 32 ? `${raw.slice(0, 32)}…` : raw;
    navigation.setOptions({ title });
  }, [book?.title, navigation]);

  useEffect(() => {
    const fromBook = book?.status;
    if (
      fromBook === "pendiente" ||
      fromBook === "leyendo" ||
      fromBook === "leido"
    ) {
      setSelectedStatus(fromBook);
    }
  }, [book?.status]);

  useEffect(() => {
    setIsFavorite(Boolean(book?.isFavorite));
  }, [book?.isFavorite]);

  useEffect(() => {
    setReviewDraft(book?.reviewText ?? "");
    setReviewFavoriteQuote(book?.favoriteQuote ?? "");
    setReviewRecommendation(
      book?.recommendation === "si" ||
        book?.recommendation === "depende" ||
        book?.recommendation === "no"
        ? book.recommendation
        : undefined,
    );
    const ratingValue = book?.rating ? Math.max(0, Math.min(5, Math.round(book.rating))) : 0;
    setReviewRating(ratingValue);
    setReviewTags(book?.tags ?? []);
    const normalizedTimesRead =
      book?.timesRead && TIMES_READ_OPTIONS.includes(book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
        ? (book.timesRead as (typeof TIMES_READ_OPTIONS)[number])
        : toTimesReadLabel(book?.readCount);
    setReviewTimesRead(normalizedTimesRead);
    const readAtSource = book?.readAt ?? book?.lastPageMarkedAt;
    const parsedReadAt = readAtSource ? new Date(readAtSource) : null;
    if (parsedReadAt && !Number.isNaN(parsedReadAt.getTime())) {
      setReviewReadAtDate(parsedReadAt);
      setReviewReadAt(toReadAtValue(parsedReadAt));
    }
  }, [book?.reviewText, book?.favoriteQuote, book?.recommendation, book?.rating, book?.tags, book?.lastPageMarkedAt, book?.readAt, book?.readCount, book?.timesRead]);

  function addReviewTag(raw: string) {
    const normalized = raw.trim().replace(/^#/, "");
    if (!normalized) return;
    if (normalized.length > 30) {
      Alert.alert("Etiqueta demasiado larga", "Maximo 30 caracteres.");
      return;
    }
    setReviewTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      return [...prev, normalized];
    });
    setReviewTagInput("");
  }

  function toReadAtValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function onReviewDateValueChange(
    event: unknown,
    selectedDate?: Date,
  ) {
    let nextDate = selectedDate;
    if (!nextDate && Platform.OS === "web") {
      const targetValue = (event as { target?: { value?: string } })?.target?.value;
      if (typeof targetValue === "string" && targetValue.trim()) {
        const parsed = new Date(targetValue);
        if (!Number.isNaN(parsed.getTime())) {
          nextDate = parsed;
        }
      }
    }
    if (!nextDate) return;
    const boundedDate = nextDate > new Date() ? new Date() : nextDate;
    setReviewReadAtDate(boundedDate);
    setReviewReadAt(toReadAtValue(boundedDate));
    if (Platform.OS !== "ios") {
      setReviewDatePickerOpen(false);
    }
  }

  useEffect(() => {
    const pages = Math.max(1, book?.pages ?? 1);
    const fromProgress = Math.round(((book?.progress ?? 0) / 100) * pages);
    const fromLatestSession = latestBookSession?.currentPage ?? null;
    const initialCandidate =
      fromLatestSession != null && Number.isFinite(fromLatestSession)
        ? fromLatestSession
        : fromProgress;
    const initialPage = Math.max(0, Math.min(pages, Math.round(initialCandidate)));
    setCurrentPage(initialPage);
    setPageInput(initialPage > 0 ? String(initialPage) : "");

    if (bookSessions.length > 0) {
      setPageHistory(
        bookSessions.slice(0, 20).map((session) => ({
          page: Math.max(1, session.currentPage),
          when: session.recordedAt || session.createdAt,
        })),
      );
      return;
    }

    const lastMarkedAt = book?.lastPageMarkedAt;
    if (lastMarkedAt) {
      setPageHistory([{ page: initialPage || 1, when: lastMarkedAt }]);
    } else {
      setPageHistory([]);
    }
  }, [book?.pages, book?.progress, book?.lastPageMarkedAt, latestBookSession?.currentPage, bookSessions]);

  if (detailQuery.isLoading && !detailQuery.data) {
    return <AppLoader />;
  }

  function onDeletePress() {
    setDeleteConfirmOpen(true);
  }

  function moveToTab(tab: DetailTab) {
    setActiveTab(tab);
    const idx = DETAIL_TABS.indexOf(tab);
    pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: true });
  }

  function onPagerEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x;
    const idx = Math.round(x / pageWidth);
    setActiveTab(DETAIL_TABS[idx] ?? "Información");
  }

  function scrollReviewToBottom() {
    setTimeout(() => {
      reviewScrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }

  return (
    <Screen
      edges={["bottom", "left", "right"]}
      webBackgroundColor={theme.colors.bgPanel}
      style={{ paddingHorizontal: 0, paddingTop: 0 }}
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <BookCover
            uri={book?.coverUrl}
            width={82}
            aspectRatio={1.45}
            borderRadius={4}
            accessibilityLabel={`Portada: ${book?.title}`}
          />
          <View style={styles.heroMeta}>
            <Text style={styles.heroTitle}>{book?.title}</Text>
            <Text style={styles.heroAuthor}>
              {book?.author ?? "Autor desconocido"}
            </Text>
            <View style={styles.heroRatingRow}>
              <Stars rating={book?.rating} />
              {isFavorite ? (
                <Chip compact style={styles.favChip} textStyle={styles.favChipText}>
                  <Ionicons name="heart" size={12} color="#D14E72" /> Favorito
                </Chip>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.tabsRow}>
          {DETAIL_TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                style={styles.tabBtn}
                onPress={() => moveToTab(tab)}
              >
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {tab}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    active && styles.tabUnderlineActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerEnd}
        style={styles.pager}
      >
        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="bookmark-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={styles.blockLabel}>Estado de lectura</Text>
              </View>
              <Pressable
                style={styles.statePill}
                onPress={() => setStatusModalOpen(true)}
              >
                <Text style={styles.stateText}>
                  {selectedStatus.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#FFF2D4" />
              </Pressable>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Detalles del libro</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailCell}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={theme.colors.textSoft}
                    />
                    <Text style={styles.blockLabel}>Publicado en</Text>
                  </View>
                  <Text style={styles.detailValue}>{year}</Text>
                </View>
                <View style={styles.detailCell}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={theme.colors.textSoft}
                    />
                    <Text style={styles.blockLabel}>Paginas</Text>
                  </View>
                  <Text style={styles.detailValue}>{book?.pages ?? "—"}</Text>
                </View>
                <View style={styles.detailCell}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color={theme.colors.textSoft}
                    />
                    <Text style={styles.blockLabel}>Género</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {book?.genre ?? "Sin género"}
                  </Text>
                </View>
                <View style={styles.detailCell}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={theme.colors.textSoft}
                    />
                    <Text style={styles.blockLabel}>Editorial</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {book?.publisher ?? "—"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={[styles.blockLabel, styles.synopsisLabel]}>
                  Sinopsis
                </Text>
              </View>
              <Text style={styles.bodyText}>
                {book?.description ?? "No hay sinopsis disponible."}
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>

        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={styles.blockLabel}>Mi reseña</Text>
              </View>
              <Text style={styles.bodyText}>{reviewText}</Text>
            </Card.Content>
          </Card>

          <View style={styles.twoCols}>
            <Card mode="contained" style={[styles.block, styles.half]}>
              <Card.Content>
                <View style={styles.labelWithIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={theme.colors.textSoft}
                  />
                  <Text style={styles.blockLabel}>Leido en</Text>
                </View>
                <Text style={styles.detailValue}>{readAtLabel}</Text>
              </Card.Content>
            </Card>
            <Card mode="contained" style={[styles.block, styles.half]}>
              <Card.Content>
                <View style={styles.labelWithIcon}>
                  <Ionicons
                    name="repeat-outline"
                    size={15}
                    color={theme.colors.textSoft}
                  />
                  <Text style={styles.blockLabel}>Veces leido</Text>
                </View>
                <Text style={styles.detailValue}>{timesReadLabel}</Text>
              </Card.Content>
            </Card>
          </View>

          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={styles.blockLabel}>Frase o cita favorita</Text>
              </View>
              <Text style={styles.bodyText}>
                {book?.favoriteQuote ?? "Sin cita favorita por ahora."}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="thumbs-up-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={[styles.blockLabel, styles.reviewSectionLabel]}>
                  Recomendacion
                </Text>
              </View>
              <View style={styles.reviewChipsRow}>
                <Chip compact style={styles.reviewChip} textStyle={styles.reviewChipText}>
                  {recommendationLabel}
                </Chip>
              </View>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <View style={styles.labelWithIcon}>
                <Ionicons
                  name="pricetags-outline"
                  size={15}
                  color={theme.colors.textSoft}
                />
                <Text style={[styles.blockLabel, styles.reviewSectionLabel]}>
                  Etiquetas tematicas
                </Text>
              </View>
              {book?.tags && book.tags.length > 0 ? (
                <View style={styles.reviewChipsRow}>
                  {book.tags.map((tag) => (
                    <Chip
                      key={tag}
                      compact
                      style={styles.reviewChip}
                      textStyle={styles.reviewChipText}
                    >
                      #{tag}
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text style={styles.markEmpty}>Sin etiquetas todavía.</Text>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <Card mode="contained" style={styles.block}>
            <Card.Content>
              <Text style={styles.blockLabel}>Similares</Text>
              <Text style={styles.subtle}>
                Libros que podrían interesarte por género o etiquetas en común.
              </Text>
              <View style={styles.similarGrid}>
                {similarBooks.map(({ book: item, reason }) => (
                  <Link
                    key={item.id}
                    href={`/(app)/books/${item.id}` as never}
                    asChild
                  >
                    <Pressable style={styles.similarCard}>
                      <BookCover
                        uri={item.coverUrl}
                        width={102}
                        aspectRatio={1.45}
                        borderRadius={6}
                        accessibilityLabel={`Portada: ${item.title}`}
                      />
                      <Text numberOfLines={2} style={styles.similarTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.similarAuthor}>
                        {reason}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
                {similarBooks.length === 0 ? (
                  <Text style={styles.markEmpty}>
                    Aún no hay suficientes coincidencias por género o etiquetas.
                  </Text>
                ) : null}
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </ScrollView>

      <View
        style={Platform.OS === "web" ? styles.bottomMenu : styles.bottomMenuNative}
      >
        <Pressable
          style={[
            Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
            styles.menuBtnPrimary,
          ]}
          onPress={() => {
            if (activeTab === "Mi reseña") {
              setReviewModalOpen(true);
              return;
            }
            router.push({
              pathname: "/(app)/books/edit",
              params: { id: bookId },
            });
          }}
          accessibilityLabel={
            activeTab === "Mi reseña" ? "Escribir reseña" : "Editar información del libro"
          }
        >
          <Ionicons
            name={activeTab === "Mi reseña" ? "create" : "create-outline"}
            size={Platform.OS === "web" ? 17 : 22}
            color={
              Platform.OS === "web" ? "#D14E72" : theme.colors.primary
            }
          />
          {Platform.OS !== "web" ? (
            <Text style={styles.menuCellLabelNative}>
              {activeTab === "Mi reseña" ? "Reseña" : "Editar"}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          style={[
            Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
            !canMarkPage && styles.menuBtnDisabled,
          ]}
          disabled={!canMarkPage}
          onPress={() => setMarkPageModalOpen(true)}
          accessibilityLabel="Marcar página"
        >
          <Ionicons
            name="bookmark-outline"
            size={Platform.OS === "web" ? 17 : 22}
            color={
              canMarkPage
                ? Platform.OS === "web"
                  ? "#D14E72"
                  : theme.colors.primary
                : theme.colors.textMutedOnDark
            }
          />
          {Platform.OS !== "web" ? (
            <Text style={styles.menuCellLabelNative}>Página</Text>
          ) : null}
        </Pressable>

        <Pressable
          style={Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative}
          onPress={async () => {
            const previous = isFavorite;
            const next = !previous;
            setIsFavorite(next);
            try {
              await updateBook.mutateAsync({
                isFavorite: next,
                status: selectedStatus,
              });
            } catch (error) {
              setIsFavorite(previous);
              Alert.alert("No se pudo actualizar", (error as Error).message);
            }
          }}
          accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={Platform.OS === "web" ? 17 : 22}
            color={Platform.OS === "web" ? "#D14E72" : theme.colors.primary}
          />
          {Platform.OS !== "web" ? (
            <Text style={styles.menuCellLabelNative}>Favorito</Text>
          ) : null}
        </Pressable>

        <Pressable
          style={[
            Platform.OS === "web" ? styles.menuBtn : styles.menuCellNative,
            deleteBook.isPending && styles.menuBtnDisabled,
          ]}
          onPress={onDeletePress}
          disabled={deleteBook.isPending}
          accessibilityLabel="Eliminar libro"
        >
          <Ionicons
            name="trash-outline"
            size={Platform.OS === "web" ? 17 : 22}
            color={Platform.OS === "web" ? "#D14E72" : theme.colors.danger}
          />
          {Platform.OS !== "web" ? (
            <Text style={[styles.menuCellLabelNative, styles.menuCellLabelDanger]}>
              Eliminar
            </Text>
          ) : null}
        </Pressable>
      </View>

      <Modal
        visible={markPageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkPageModalOpen(false)}
      >
        <View
          style={
            Platform.OS === "web" ? styles.modalRoot : styles.reviewModalRootNative
          }
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMarkPageModalOpen(false)}
          />
          <KeyboardAvoidingView
            style={
              Platform.OS === "web"
                ? { marginHorizontal: 20, width: "100%" }
                : { width: "100%", flexShrink: 1 }
            }
            behavior={Platform.OS === "android" ? "height" : "padding"}
          >
            <View
              style={[
                styles.markSheet,
                Platform.OS !== "web" && styles.reviewSheetNative,
              ]}
            >
            <View style={styles.markHeader}>
              <Text style={styles.markTitle}>Marcar página</Text>
              <Text style={styles.markSubtitle}>
                {book?.title ?? "Libro"} · {totalPages} páginas
              </Text>
            </View>

            <Text style={styles.markLabel}>Pagina actual</Text>
            <View style={styles.markInputRow}>
              <TextInput
                value={pageInput}
                onChangeText={setPageInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textSoft}
                style={[styles.markInput, styles.markPageInput]}
              />
              <Text style={styles.markTotal}>/ {totalPages}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.markProgressText}>
              Pag. {currentPage} · {completion}% completado
            </Text>

            <Text style={styles.markLabel}>Historial reciente</Text>
            {pageHistory.length === 0 ? (
              <Text style={styles.markEmpty}>Aún no hay marcas de página.</Text>
            ) : (
              pageHistory.slice(0, 3).map((entry, idx) => (
                <View key={`${entry.when}-${idx}`} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {new Date(entry.when).toLocaleString("es-ES")}
                  </Text>
                  <Text style={styles.historyPage}>pag. {entry.page}</Text>
                </View>
              ))
            )}

            <View style={styles.markActions}>
              <Pressable
                style={[styles.markBtn, styles.markBtnPrimary]}
                onPress={async () => {
                  const next = parseNextPageInput(pageInput, totalPages);
                  if (next == null) {
                    Alert.alert(
                      "Pagina invalida",
                      `Introduce un valor entre 1 y ${totalPages}.`,
                    );
                    return;
                  }
                  try {
                    await createSession.mutateAsync(
                      buildReadingSessionPayload(next, currentPage),
                    );
                    const now = new Date().toISOString();
                    const normalizedPage = next;
                    setCurrentPage(normalizedPage);
                    setPageInput(String(normalizedPage));
                    setPageHistory((prev) => [
                      { page: normalizedPage, when: now },
                      ...prev.filter(
                        (item) =>
                          !(item.page === normalizedPage && item.when === now),
                      ),
                    ]);
                    setMarkPageModalOpen(false);
                  } catch (error) {
                    Alert.alert(
                      "No se pudo guardar",
                      (error as Error).message,
                    );
                  }
                }}
              >
                <Text style={styles.markBtnPrimaryText}>
                  {createSession.isPending ? "Guardando..." : "Guardar"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.markBtn, styles.markBtnGhost]}
                onPress={() => setMarkPageModalOpen(false)}
              >
                <Text style={styles.markBtnGhostText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={reviewModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalOpen(false)}
      >
        <View
          style={
            Platform.OS === "web" ? styles.modalRoot : styles.reviewModalRootNative
          }
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setReviewModalOpen(false)}
          />
          <KeyboardAvoidingView
            style={
              Platform.OS === "web"
                ? { marginHorizontal: 20 }
                : { width: "100%", flexShrink: 1 }
            }
            behavior={Platform.OS === "android" ? "height" : "padding"}
          >
            <View
              style={[
                styles.markSheet,
                Platform.OS !== "web" && styles.reviewSheetNative,
              ]}
            >
              <View style={styles.markHeader}>
                <Text style={styles.markTitle}>Escribir reseña y valoración</Text>
                <Text style={styles.markSubtitle}>
                  {book?.title ?? "Libro"} · {book?.author ?? "Autor"}
                </Text>
              </View>
              <ScrollView
                ref={reviewScrollRef}
                style={styles.reviewBody}
                contentContainerStyle={styles.reviewBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <Text style={styles.markLabel}>Valoración global</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable key={value} onPress={() => setReviewRating(value)}>
                    <Ionicons
                      name={reviewRating >= value ? "star" : "star-outline"}
                      size={28}
                      color={reviewRating >= value ? "#D4A62F" : "#B8A793"}
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.reviewTwoCols}>
                <View style={styles.reviewCol}>
                  <Text style={styles.markLabel}>Leído en</Text>
                  <Pressable
                    style={[
                      styles.markInput,
                      styles.reviewSmallInput,
                      styles.readAtBtn,
                    ]}
                    onPress={() => setReviewDatePickerOpen(true)}
                  >
                    <Text
                      numberOfLines={1}
                      style={
                        reviewReadAt ? styles.readAtText : styles.datePlaceholder
                      }
                    >
                      {reviewReadAt
                        ? reviewReadAtDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
                        : "Seleccionar fecha..."}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.reviewCol}>
                  <Text style={styles.markLabel}>Veces leído</Text>
                  <Pressable
                    style={[styles.markInput, styles.reviewSmallInput, styles.timesReadBtn]}
                    onPress={() => setTimesReadModalOpen(true)}
                  >
                    <Text style={styles.timesReadText}>{reviewTimesRead}</Text>
                    <Ionicons name="chevron-down" size={18} color="#E4BC78" />
                  </Pressable>
                </View>
              </View>
              {reviewDatePickerOpen ? (
                <View style={styles.datePickerWrap}>
                  {Platform.OS === "web" ? (
                    <>
                      {createElement("input", {
                        type: "date",
                        value: reviewReadAt,
                        max: toReadAtValue(new Date()),
                        onChange: (e: ChangeEvent<HTMLInputElement>) => {
                          const v = e.currentTarget.value;
                          if (!v.trim()) return;
                          const parsed = new Date(`${v}T12:00:00`);
                          if (Number.isNaN(parsed.getTime())) return;
                          const bounded = parsed > new Date() ? new Date() : parsed;
                          setReviewReadAtDate(bounded);
                          setReviewReadAt(toReadAtValue(bounded));
                          setReviewDatePickerOpen(false);
                        },
                        style: {
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 12px",
                          fontSize: 16,
                          borderRadius: 8,
                          border: "1px solid #8C653A",
                          backgroundColor: "#2F120A",
                          color: "#F2D3A2",
                          fontFamily: "Georgia, 'Times New Roman', serif",
                        },
                      })}
                      <Pressable
                        style={styles.datePickerDoneBtn}
                        onPress={() => setReviewDatePickerOpen(false)}
                      >
                        <Text style={styles.datePickerDoneText}>Cerrar</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <DateTimePicker
                        value={reviewReadAtDate}
                        mode="date"
                        maximumDate={new Date()}
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        {...(Platform.OS === "ios"
                          ? {
                              accentColor: "#9E7144",
                              textColor: "#E4BC78",
                              themeVariant: "dark" as const,
                            }
                          : {})}
                        onChange={onReviewDateValueChange}
                      />
                      {Platform.OS === "ios" ? (
                        <Pressable
                          style={styles.datePickerDoneBtn}
                          onPress={() => setReviewDatePickerOpen(false)}
                        >
                          <Text style={styles.datePickerDoneText}>Aceptar fecha</Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}
                </View>
              ) : null}

              <View style={styles.reviewHeaderRow}>
                <Text style={styles.markLabel}>Reseña personal</Text>
                <Text style={styles.counterText}>{reviewDraft.length}/2000</Text>
              </View>
                <TextInput
                  value={reviewDraft}
                  onChangeText={(text) => setReviewDraft(text.slice(0, 2000))}
                  onFocus={scrollReviewToBottom}
                  multiline
                  placeholder="¿Qué te pareció el libro? Escribe con libertad..."
                  placeholderTextColor={theme.colors.textSoft}
                  style={[styles.markInput, styles.reviewInput]}
                />

              <Text style={styles.markLabel}>Frase o cita favorita</Text>
                <TextInput
                  value={reviewFavoriteQuote}
                  onChangeText={setReviewFavoriteQuote}
                  onFocus={scrollReviewToBottom}
                  multiline
                  placeholder="Una frase del libro que te haya marcado..."
                  placeholderTextColor={theme.colors.textSoft}
                  style={[styles.markInput, styles.quoteInput]}
                />

              <Text style={styles.markLabel}>Etiquetas tematicas</Text>
              <View style={styles.tagInputRow}>
                  <TextInput
                    value={reviewTagInput}
                    onChangeText={setReviewTagInput}
                    onFocus={scrollReviewToBottom}
                    onSubmitEditing={() => addReviewTag(reviewTagInput)}
                    returnKeyType="done"
                    placeholder="Escribe una etiqueta"
                    placeholderTextColor={theme.colors.textSoft}
                    style={[styles.markInput, styles.reviewSmallInput, styles.tagInput]}
                  />
                <Pressable
                  style={styles.tagAddBtn}
                  onPress={() => addReviewTag(reviewTagInput)}
                >
                  <Ionicons name="add" size={18} color={theme.colors.onPrimary} />
                </Pressable>
              </View>
              {reviewTags.length > 0 ? (
                <View style={styles.reviewChipsRow}>
                  {reviewTags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={styles.tagChipBtn}
                      onPress={() =>
                        setReviewTags((prev) => prev.filter((value) => value !== tag))
                      }
                    >
                      <Text style={styles.tagChipText}>#{tag} ×</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.markEmpty}>Sin etiquetas todavía.</Text>
              )}

              <Text style={styles.markLabel}>¿Lo recomendarías?</Text>
              <View style={styles.recommendRow}>
                <Pressable
                  style={[
                    styles.recommendBtn,
                    reviewRecommendation === "si" && styles.recommendBtnActive,
                  ]}
                  onPress={() => setReviewRecommendation("si")}
                >
                  <Text
                    style={[
                      styles.recommendText,
                      reviewRecommendation === "si" && styles.recommendTextActive,
                    ]}
                  >
                    👍 Sí
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.recommendBtn,
                    reviewRecommendation === "depende" && styles.recommendBtnActive,
                  ]}
                  onPress={() => setReviewRecommendation("depende")}
                >
                  <Text
                    style={[
                      styles.recommendText,
                      reviewRecommendation === "depende" && styles.recommendTextActive,
                    ]}
                  >
                    🤔 Depende
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.recommendBtn,
                    reviewRecommendation === "no" && styles.recommendBtnActive,
                  ]}
                  onPress={() => setReviewRecommendation("no")}
                >
                  <Text
                    style={[
                      styles.recommendText,
                      reviewRecommendation === "no" && styles.recommendTextActive,
                    ]}
                  >
                    👎 No
                  </Text>
                </Pressable>
              </View>
              </ScrollView>
              <View style={styles.markActions}>
              <Pressable
                style={[styles.markBtn, styles.markBtnPrimary]}
                onPress={async () => {
                  try {
                    await updateBook.mutateAsync({
                      reviewText: reviewDraft.trim() || undefined,
                      rating: reviewRating > 0 ? reviewRating : undefined,
                      readAt: reviewReadAt.trim() || undefined,
                      timesRead: reviewTimesRead,
                      favoriteQuote: reviewFavoriteQuote.trim() || undefined,
                      wouldRecommend: reviewRecommendation,
                      reviewTags,
                      status: selectedStatus,
                    });
                    setReviewReadAtDisplay(
                      reviewReadAt.trim()
                        ? new Date(reviewReadAt).toLocaleDateString("es-ES")
                        : "Sin registro",
                    );
                    setReviewTimesReadDisplay(reviewTimesRead);
                    setReviewModalOpen(false);
                  } catch (error) {
                    Alert.alert(
                      "No se pudo guardar la reseña",
                      (error as Error).message,
                    );
                  }
                }}
              >
                <Text style={styles.markBtnPrimaryText}>
                  {updateBook.isPending ? "Publicando..." : "Publicar reseña"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.markBtn, styles.markBtnGhost]}
                onPress={() => setReviewModalOpen(false)}
              >
                <Text style={styles.markBtnGhostText}>Cancelar</Text>
              </Pressable>
            </View>
              </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={timesReadModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimesReadModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setTimesReadModalOpen(false)}
          />
          <View style={styles.statusSheet}>
            {TIMES_READ_OPTIONS.map((option) => {
              const active = option === reviewTimesRead;
              return (
                <Pressable
                  key={option}
                  style={styles.statusRow}
                  onPress={() => {
                    setReviewTimesRead(option);
                    setTimesReadModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.statusRowText,
                      active && styles.statusRowTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.colors.primary}
                    />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDeleteConfirmOpen(false)}
          />
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Eliminar libro</Text>
            <Text style={styles.confirmText}>
              ¿Seguro que quieres eliminar este libro? Esta accion no se puede
              deshacer.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnGhost]}
                onPress={() => setDeleteConfirmOpen(false)}
              >
                <Text style={styles.confirmBtnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnDanger]}
                onPress={async () => {
                  try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    await deleteBook.mutateAsync();
                    setDeleteConfirmOpen(false);
                    setDeleteSuccessOpen(true);
                  } catch (error) {
                    Alert.alert("No se pudo eliminar", (error as Error).message);
                  }
                }}
              >
                <Text style={styles.confirmBtnDangerText}>
                  {deleteBook.isPending ? "Eliminando..." : "Eliminar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteSuccessOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteSuccessOpen(false);
          router.replace("/(app)/(tabs)/home");
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setDeleteSuccessOpen(false);
              router.replace("/(app)/(tabs)/home");
            }}
          />
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Libro eliminado</Text>
            <Text style={styles.confirmText}>
              El libro se ha eliminado correctamente.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnDanger]}
                onPress={() => {
                  setDeleteSuccessOpen(false);
                  router.replace("/(app)/(tabs)/home");
                }}
              >
                <Text style={styles.confirmBtnDangerText}>Continuar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={statusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setStatusModalOpen(false)}
          />
          <View style={styles.statusSheet}>
            {STATUS_OPTIONS.map((status) => {
              const active = status === selectedStatus;
              return (
                <Pressable
                  key={status}
                  style={styles.statusRow}
                  onPress={async () => {
                    const previous = selectedStatus;
                    setSelectedStatus(status);
                    setStatusModalOpen(false);
                    try {
                      await updateStatus.mutateAsync(status);
                    } catch (error) {
                      setSelectedStatus(previous);
                      Alert.alert(
                        "No se pudo actualizar",
                        (error as Error).message,
                      );
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.statusRowText,
                      active && styles.statusRowTextActive,
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.colors.primary}
                    />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.bgPanel,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  heroTop: {
    flexDirection: "row",
    gap: 12,
  },
  heroMeta: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 26,
    color: theme.colors.textOnDark,
    lineHeight: 30,
  },
  heroAuthor: {
    fontSize: 14,
    fontStyle: "italic",
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.accent,
    marginTop: 2,
  },
  heroRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  stars: {
    color: theme.colors.accent,
    letterSpacing: 1.5,
    fontSize: 15,
  },
  favChip: {
    backgroundColor: theme.colors.cardElevated,
  },
  favChipText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
  },
  tabsRow: {
    flexDirection: "row",
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  tabLabel: {
    color: theme.colors.textMutedOnDark,
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: theme.colors.accent,
  },
  tabUnderline: {
    height: 1.5,
    width: "48%",
    backgroundColor: "transparent",
  },
  tabUnderlineActive: {
    backgroundColor: theme.colors.accent,
  },
  pager: {
    flex: 1,
    backgroundColor: theme.colors.bgPanel,
  },
  tabContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 96,
  },
  block: {
    backgroundColor: "#F3E9D8",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(179, 154, 125, 0.35)",
    shadowColor: "#2A1A11",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  blockLabel: {
    color: theme.colors.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 12,
    fontFamily: "Fraunces_700Bold",
    marginBottom: 0,
  },
  reviewSectionLabel: {
    color: theme.colors.text,
  },
  synopsisLabel: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
  },
  statePill: {
    borderRadius: 8,
    backgroundColor: "#9E7144",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateText: {
    color: "#FFF2D4",
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 6,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 12,
  },
  detailCell: {
    width: "47%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderOnCard,
    paddingBottom: 8,
  },
  detailValue: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  bodyText: {
    color: theme.colors.text,
    lineHeight: 22,
    fontSize: 15,
    fontFamily: "Fraunces_400Regular",
  },
  twoCols: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  reviewChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reviewChip: {
    backgroundColor: "rgba(158, 113, 68, 0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122, 88, 55, 0.45)",
  },
  reviewChipText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
  },
  tagsPlaceholder: {
    height: 34,
  },
  subtle: {
    color: theme.colors.textSoft,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: "Fraunces_400Regular",
  },
  similarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  similarCard: {
    width: 108,
    gap: 4,
  },
  similarTitle: {
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
    fontSize: 15,
  },
  similarAuthor: {
    color: theme.colors.textSoft,
    fontStyle: "italic",
    fontSize: 13,
  },
  bottomMenu: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bgPanel,
  },
  menuBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtnPrimary: {},
  menuBtnDisabled: {
    opacity: 0.5,
  },
  bottomMenuNative: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  menuCellNative: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  menuCellLabelNative: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 10,
    color: theme.colors.textSoft,
    letterSpacing: 0.2,
  },
  menuCellLabelDanger: {
    color: theme.colors.danger,
  },
  reviewModalRootNative: {
    flex: 1,
    justifyContent: "flex-end",
  },
  reviewSheetNative: {
    marginHorizontal: 0,
    width: "100%",
    maxWidth: "100%",
    maxHeight: "92%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 3,
    borderTopColor: theme.colors.accent,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    paddingBottom: 20,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(74, 61, 52, 0.35)",
  },
  confirmSheet: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    marginHorizontal: 24,
    backgroundColor: "#230A05",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8C653A",
    padding: 14,
    gap: 12,
  },
  confirmTitle: {
    color: "#E4BC78",
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
  },
  confirmText: {
    color: "#D5AF72",
    fontSize: 15,
    lineHeight: 21,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnGhost: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#6B4B31",
    backgroundColor: "#28140F",
  },
  confirmBtnDanger: {
    backgroundColor: "#9E7144",
  },
  confirmBtnGhostText: {
    color: "#D9B477",
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
  confirmBtnDangerText: {
    color: "#FFF1D9",
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
  statusSheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 440,
    marginHorizontal: 24,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusRowText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 0.6,
  },
  statusRowTextActive: {
    color: theme.colors.primary,
  },
  markSheet: {
    marginHorizontal: 20,
    width: "100%",
    maxWidth: 860,
    maxHeight: "82%",
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.cardElevated,
    padding: 16,
    gap: 12,
  },
  markHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingBottom: 10,
  },
  markTitle: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
  },
  markSubtitle: {
    color: theme.colors.textSoft,
    fontSize: 15,
    fontFamily: "Fraunces_400Regular",
  },
  markLabel: {
    color: theme.colors.textSoft,
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  markInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    borderRadius: 12,
  },
  markPageInput: {
    fontSize: 28,
  },
  reviewInput: {
    minHeight: 120,
    fontSize: 18,
    textAlignVertical: "top",
    fontFamily: "Fraunces_400Regular",
  },
  reviewBody: {
    maxHeight: 420,
  },
  reviewBodyContent: {
    gap: 10,
    paddingBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  reviewTwoCols: {
    flexDirection: "row",
    gap: 10,
  },
  reviewCol: {
    flex: 1,
  },
  reviewSmallInput: {
    minHeight: 54,
    fontSize: 16,
    fontFamily: "Fraunces_400Regular",
  },
  timesReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timesReadText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  readAtBtn: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  readAtText: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
    marginTop: 1,
  },
  datePlaceholder: {
    color: theme.colors.textMutedOnDark,
    fontFamily: "Fraunces_400Regular",
    fontSize: 16,
  },
  datePickerWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.bgSoft,
    padding: 8,
  },
  datePickerDoneBtn: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  datePickerDoneText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontFamily: "Fraunces_400Regular",
  },
  quoteInput: {
    minHeight: 84,
    fontSize: 16,
    fontFamily: "Fraunces_400Regular",
  },
  recommendRow: {
    flexDirection: "row",
    gap: 8,
  },
  recommendBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bgSoft,
  },
  recommendBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recommendText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    textAlign: "center",
  },
  recommendTextActive: {
    color: theme.colors.onPrimary,
  },
  tagChipBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderOnCard,
    backgroundColor: theme.colors.bgSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipText: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 13,
  },
  tagInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
  },
  tagAddBtn: {
    width: 44,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.primaryPressed,
  },
  markTotal: {
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 32,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
  },
  markProgressText: {
    color: theme.colors.textSoft,
    fontSize: 15,
  },
  markEmpty: {
    color: theme.colors.textMutedOnDark,
    fontSize: 14,
    fontStyle: "italic",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6,
  },
  historyDate: {
    color: theme.colors.textSoft,
    fontSize: 15,
  },
  historyPage: {
    color: theme.colors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
  },
  markActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  markBtn: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  markBtnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  markBtnGhost: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
  },
  markBtnPrimaryText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
  },
  markBtnGhostText: {
    color: theme.colors.primary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
  },
});
