import { useMemo } from "react";

import { useBooksFeed } from "@/features/books/use-books";
import { defaultLibraryBooksQuery } from "@/shared/types/books";
import type { Book } from "@/shared/types/books";

export type SimilarBookEntry = {
  book: Book;
  reason: "Mismo género" | "Misma etiqueta";
};

export function useSimilarBooks(
  bookId: string | undefined,
  genre: string | undefined,
  tags: string[] | undefined,
) {
  const similarByGenreFeed = useBooksFeed(
    useMemo(
      () => ({
        ...defaultLibraryBooksQuery,
        genre: genre?.trim() ? genre : null,
        sort: "recientes" as const,
      }),
      [genre],
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
    const targetGenre = genre?.toLowerCase().trim();
    const baseTags = new Set(
      (tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean),
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
        (candidate.tags ?? []).some((tag) => baseTags.has(tag.toLowerCase().trim())),
      )
      .map((candidate) => ({ book: candidate, reason: "Misma etiqueta" as const }));

    return [...genreCandidates, ...tagCandidates].slice(0, 6);
  }, [
    bookId,
    genre,
    tags,
    similarByGenreFeed.data?.pages,
    similarByTagsFeed.data?.pages,
  ]);

  return similarBooks;
}
