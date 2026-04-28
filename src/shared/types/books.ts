/** Ordenación alineada con GET /books de la API web. */
export type BooksSortKey = "recientes" | "titulo" | "autor" | "genero" | "valoracion";

/** Estante virtual (misma semántica que la biblioteca web). */
export type LibraryShelfFilter = "todos" | "pendiente" | "leyendo" | "leido" | "favoritos";

/** Filtro de estado de lectura enviado como query `status`. */
export type LibraryStatusFilter = "todos" | "pendiente" | "leyendo" | "leido";

/** Parámetros de listado de biblioteca (servidor). */
export type LibraryBooksQuery = {
  search: string;
  status: LibraryStatusFilter;
  shelf: LibraryShelfFilter;
  genre: string | null;
  sort: BooksSortKey;
};

export const defaultLibraryBooksQuery: LibraryBooksQuery = {
  search: "",
  status: "todos",
  shelf: "todos",
  genre: null,
  sort: "recientes",
};

export type Book = {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string | null;
  pages?: number;
  progress?: number;
  status?: "pendiente" | "leyendo" | "leido";
  genre?: string;
  rating?: number | null;
  isFavorite?: boolean;
  publishedYear?: number;
  updatedAt?: string;
  lastPageMarkedAt?: string | null;
  tags?: string[];
  publisher?: string;
};

export type BooksSummary = {
  total: number;
  pendiente: number;
  leyendo: number;
  leido: number;
  favoritos: number;
  ratedSum: number;
  ratedCount: number;
  latestYear: number;
  genres: { genre: string; count: number }[];
};

export type PaginatedBooks = {
  items: Book[];
  offset: number;
  total: number;
  limit: number;
  hasMore: boolean;
};

export type BookDetail = Book & {
  description?: string;
  progressPercent?: number;
  reviewText?: string;
  readCount?: number;
  favoriteQuote?: string;
  recommendation?: string;
};

export type CreateReadingSessionPayload = {
  bookId: string;
  currentPage: number;
  previousPage?: number;
  recordedAt?: string;
};

