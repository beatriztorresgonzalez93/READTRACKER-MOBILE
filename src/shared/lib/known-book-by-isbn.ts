// Metadatos fiables para ISBN muy conocidos (cuando APIs públicas o IA fallan).
import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";
import { isbnCoverUrl, normalizeIsbn } from "@/shared/lib/isbn-utils";

type KnownEntry = Omit<BookMetadataFromIsbn, "isbn" | "coverUrls">;

const KNOWN: Record<string, KnownEntry> = {
  "9788408316084": {
    title: "Alas de sangre",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "792",
    publishedYear: "2024",
    description:
      "Violet Sorrengail debe entrar en el Colegio de Guerra de Basgiath y convertirse en jinete de dragón, en un mundo donde solo los más fuertes sobreviven.",
  },
  "9788409383086": {
    title: "Alas de hierro",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "784",
    publishedYear: "2024",
    description: "Segunda entrega de la saga Empíreo. La guerra exige sacrificios imposibles a los jinetes de dragón.",
  },
  "9788409383093": {
    title: "Alas de ónice",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "800",
    publishedYear: "2025",
    description: "Tercera entrega de Empíreo. Violet y sus aliados afrontan secretos que amenazan el reino.",
  },
};

export function getKnownBookByIsbn(rawIsbn: string): BookMetadataFromIsbn | null {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;
  const entry = KNOWN[isbn];
  if (!entry) return null;
  return {
    isbn,
    ...entry,
    coverUrls: [isbnCoverUrl(isbn)],
  };
}
