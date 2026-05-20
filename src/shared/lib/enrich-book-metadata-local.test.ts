import { normalizeGenreToSpanish } from "@/shared/lib/enrich-book-metadata-local";

describe("enrich-book-metadata-local", () => {
  it("maps English categories to one Spanish genre", () => {
    expect(normalizeGenreToSpanish("Fiction, Mystery, Thriller")).toBe("Thriller");
    expect(normalizeGenreToSpanish("Fantasy")).toBe("Fantasía");
  });

  it("keeps short Spanish genre as-is", () => {
    expect(normalizeGenreToSpanish("Novela histórica")).toBe("Novela histórica");
  });
});
