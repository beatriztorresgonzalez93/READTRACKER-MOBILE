// Tipos de dominio para sesiones de lectura en la capa backend.
export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  author: string;
  previousPage: number | null;
  currentPage: number;
  pagesRead: number;
  recordedAt: string;
  createdAt: string;
}

export interface CreateReadingSessionDto {
  bookId: string;
  previousPage?: number | null;
  currentPage: number;
  recordedAt?: string;
}
