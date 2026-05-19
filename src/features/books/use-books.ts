// Hooks de consultas y mutaciones para obtener y actualizar libros.
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import { createBook, createReadingSession, deleteBook, getBookById, getBooksPage, getBooksSummary, type CreateBookPayload, type UpdateBookPayload, updateBook, updateBookStatus } from "@/shared/api/books-api";
import { defaultLibraryBooksQuery, type Book, type CreateReadingSessionPayload, type LibraryBooksQuery } from "@/shared/types/books";

const LEYENDO_PREVIEW_QUERY: LibraryBooksQuery = {
  ...defaultLibraryBooksQuery,
  status: "leyendo",
};

const LEIDOS_HOME_CAROUSEL_QUERY: LibraryBooksQuery = {
  ...defaultLibraryBooksQuery,
  status: "leido",
  sort: "recientes",
};

export function useLeyendoPreview() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["books", "leyendo-preview"],
    queryFn: async (): Promise<Book[]> => {
      const page = await getBooksPage(token ?? "", 0, 6, LEYENDO_PREVIEW_QUERY);
      return page.items;
    },
    enabled: Boolean(token),
  });
}

/** Hasta 10 libros terminados (estado leído), más recientes primero, para el carrusel del inicio. */
export function useLeidosHomeCarousel() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["books", "leidos-home-carousel"],
    queryFn: async (): Promise<Book[]> => {
      const page = await getBooksPage(token ?? "", 0, 10, LEIDOS_HOME_CAROUSEL_QUERY);
      return page.items;
    },
    enabled: Boolean(token),
  });
}

export function useBooksFeed(listQuery: LibraryBooksQuery) {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: [
      "books",
      "feed",
      listQuery.search,
      listQuery.status,
      listQuery.shelf,
      listQuery.genre,
      listQuery.sort,
    ],
    queryFn: ({ pageParam = 0 }) => getBooksPage(token ?? "", pageParam, 10, listQuery),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined),
    enabled: Boolean(token),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  });
}

export function useBooksSummary() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["books", "summary"],
    queryFn: () => getBooksSummary(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useBookDetail(bookId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["books", "detail", bookId],
    queryFn: () => getBookById(token ?? "", bookId),
    enabled: Boolean(token && bookId),
  });
}

export function useCreateReadingSession(bookId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateReadingSessionPayload, "bookId">) =>
      createReadingSession(token ?? "", { ...payload, bookId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reading-sessions", "list"] });
      await queryClient.invalidateQueries({ queryKey: ["history", "monthly"] });
      await queryClient.invalidateQueries({ queryKey: ["stats", "reading"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leidos-home-carousel"] });
    },
  });
}

export function useUpdateBookStatus(bookId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: NonNullable<Book["status"]>) => updateBookStatus(token ?? "", bookId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leidos-home-carousel"] });
    },
  });
}

export function useCreateBook() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookPayload) => createBook(token ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leidos-home-carousel"] });
    },
  });
}

export function useUpdateBook(bookId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBookPayload) => updateBook(token ?? "", bookId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leidos-home-carousel"] });
    },
  });
}

export function useDeleteBook(bookId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteBook(token ?? "", bookId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leidos-home-carousel"] });
      await queryClient.removeQueries({ queryKey: ["books", "detail", bookId] });
    },
  });
}

