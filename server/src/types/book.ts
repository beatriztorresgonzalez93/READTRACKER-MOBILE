// Contratos de datos del dominio Book compartidos entre capas del backend.
export type ReadingStatus = "pendiente" | "leyendo" | "leido";

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  genre: string;
  pages?: number;
  publicationYear?: number;
  status: ReadingStatus;
  rating?: number;
  review?: string;
  synopsis?: string;
  reviewTags?: string[];
  readAt?: string;
  timesRead?: string;
  favoriteQuote?: string;
  wouldRecommend?: "si" | "depende" | "no";
  progress?: number;
  currentPage?: number;
  lastPageMarkedAt?: string;
  coverUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookDto {
  title: string;
  author: string;
  publisher: string;
  genre: string;
  pages?: number;
  publicationYear?: number;
  status: ReadingStatus;
  rating?: number;
  review?: string;
  synopsis?: string;
  reviewTags?: string[];
  readAt?: string;
  timesRead?: string;
  favoriteQuote?: string;
  wouldRecommend?: "si" | "depende" | "no";
  progress?: number;
  currentPage?: number;
  lastPageMarkedAt?: string;
  coverUrl?: string;
  isFavorite?: boolean;
}

export interface UpdateBookDto extends Partial<CreateBookDto> {}

/** Ordenación alineada con la biblioteca del cliente. */
export type BookSortKey = "recientes" | "titulo" | "autor" | "genero" | "valoracion";

/** Filtros para listado paginado de libros. */
export interface BookListPageFilters {
  search?: string;
  hookStatus?: string;
  shelf?: string;
  genre?: string | null;
  sort: BookSortKey;
}

/** Totales globales de la biblioteca (barra lateral / reseñas). */
export interface LibrarySummaryDto {
  total: number;
  pendiente: number;
  leyendo: number;
  leido: number;
  favoritos: number;
  ratedSum: number;
  ratedCount: number;
  latestYear: number;
  genres: { genre: string; count: number }[];
}
