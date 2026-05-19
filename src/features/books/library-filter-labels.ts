import type { BooksSortKey, LibraryShelfFilter, LibraryStatusFilter } from "@/shared/types/books";

export const LIBRARY_SORT_LABELS: Record<BooksSortKey, string> = {
  recientes: "Más recientes",
  titulo: "Título (A-Z)",
  autor: "Autor (A-Z)",
  genero: "Género (A-Z)",
  valoracion: "Valoración",
};

export const LIBRARY_STATUS_LABELS: Record<LibraryStatusFilter, string> = {
  todos: "Todos",
  pendiente: "Pendientes",
  leyendo: "Leyendo",
  leido: "Leídos",
};

export const LIBRARY_SHELF_LABELS: Record<LibraryShelfFilter, string> = {
  todos: "Todos",
  pendiente: "Pendientes",
  leyendo: "Leyendo",
  leido: "Leídos",
  favoritos: "Favoritos",
};
