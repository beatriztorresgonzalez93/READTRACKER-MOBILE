import {
  isTranslationApiNoise,
  normalizeGenreToSpanish,
  sanitizeBookDescription,
} from "@/shared/lib/enrich-book-metadata-local";

describe("enrich-book-metadata-local", () => {
  it("detects MyMemory error noise", () => {
    expect(isTranslationApiNoise("QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS")).toBe(
      true,
    );
  });

  it("sanitizes url-encoded synopsis", () => {
    const raw = "QUERY LENGTH LIMIT EXCEEDED.%20Pero%20as%20Lowen";
    const clean = sanitizeBookDescription(raw);
    expect(clean).toContain("Pero as Lowen");
    expect(clean).not.toContain("QUERY LENGTH");
  });

  it("maps English categories to one Spanish genre", () => {
    expect(normalizeGenreToSpanish("Fiction, Mystery, Thriller")).toBe("Thriller");
  });
});
