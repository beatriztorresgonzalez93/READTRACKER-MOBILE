// ISBN conocidos (saga Empíreo, etc.) — fallback antes de Groq en discover.
export type KnownBookEntry = {
  title: string;
  author: string;
  publisher: string;
  genre: string;
  pages: string;
  publishedYear: string;
  description: string;
};

export const KNOWN_BOOKS_BY_ISBN: Record<string, KnownBookEntry> = {
  "9788408316084": {
    title: "Alas de sangre",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "792",
    publishedYear: "2024",
    description:
      "Violet Sorrengail debe entrar en el Colegio de Guerra de Basgiath y convertirse en jinete de dragón.",
  },
  "9788409383086": {
    title: "Alas de hierro",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "784",
    publishedYear: "2024",
    description: "Segunda entrega de la saga Empíreo.",
  },
  "9788409383093": {
    title: "Alas de ónice",
    author: "Rebecca Yarros",
    publisher: "Booket",
    genre: "Fantasía",
    pages: "800",
    publishedYear: "2025",
    description: "Tercera entrega de la saga Empíreo.",
  },
};

export function getKnownBookByIsbn(isbn: string): KnownBookEntry | null {
  return KNOWN_BOOKS_BY_ISBN[isbn] ?? null;
}
