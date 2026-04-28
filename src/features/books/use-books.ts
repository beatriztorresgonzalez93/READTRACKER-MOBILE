import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import { createReadingSession, getBookById, getBooksPage, getBooksSummary } from "@/shared/api/books-api";
import { defaultLibraryBooksQuery, type Book, type CreateReadingSessionPayload, type LibraryBooksQuery } from "@/shared/types/books";

const LEYENDO_PREVIEW_QUERY: LibraryBooksQuery = {
  ...defaultLibraryBooksQuery,
  status: "leyendo",
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
      await queryClient.invalidateQueries({ queryKey: ["books", "feed"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
      await queryClient.invalidateQueries({ queryKey: ["books", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["books", "leyendo-preview"] });
    },
  });
}

