import {
  coverPaletteFromTitle,
  shouldPreferTitlePlaceholder,
} from "@/shared/lib/book-cover-placeholder";

describe("book-cover-placeholder", () => {
  it("detects fake seed Open Library ISBN covers", () => {
    expect(
      shouldPreferTitlePlaceholder(
        "https://covers.openlibrary.org/b/isbn/97884083012345-M.jpg",
      ),
    ).toBe(true);
    expect(shouldPreferTitlePlaceholder("https://example.com/cover.jpg")).toBe(false);
  });

  it("picks stable palette for same title", () => {
    const a = coverPaletteFromTitle("Alas de sangre");
    const b = coverPaletteFromTitle("Alas de sangre");
    expect(a).toEqual(b);
  });
});
