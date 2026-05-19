import { extractOpenLibraryCoverUrls } from "../src/services/coversService";

describe("extractOpenLibraryCoverUrls", () => {
  it("uses cover_i, olid and isbn", () => {
    const urls = extractOpenLibraryCoverUrls([
      { cover_i: 123 },
      { cover_edition_key: "OL60489089M" },
      { isbn: ["9780000000000"] },
    ]);
    expect(urls).toEqual([
      "https://covers.openlibrary.org/b/id/123-M.jpg",
      "https://covers.openlibrary.org/b/olid/OL60489089M-M.jpg",
      "https://covers.openlibrary.org/b/isbn/9780000000000-M.jpg",
    ]);
  });

  it("deduplicates and limits to 8", () => {
    const docs = Array.from({ length: 12 }, (_, i) => ({ cover_i: 1000 + i }));
    expect(extractOpenLibraryCoverUrls(docs)).toHaveLength(8);
  });
});
