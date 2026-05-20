import { isbnCoverUrl, normalizeIsbn, parseIsbnFromBarcode } from "@/shared/lib/isbn-utils";

describe("isbn-utils", () => {
  it("normalizes ISBN-13 with separators", () => {
    expect(normalizeIsbn("978-0-15-601259-5")).toBe("9780156012595");
  });

  it("rejects non-book EAN", () => {
    expect(normalizeIsbn("1234567890123")).toBeNull();
  });

  it("parses barcode string", () => {
    expect(parseIsbnFromBarcode("9780156012595")).toBe("9780156012595");
  });

  it("builds cover url", () => {
    expect(isbnCoverUrl("9780156012595")).toContain("9780156012595");
  });
});
