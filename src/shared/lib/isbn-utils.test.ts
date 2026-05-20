import { isbn10ToIsbn13, normalizeIsbn } from "@/shared/lib/isbn-utils";

describe("isbn-utils", () => {
  it("converts ISBN-10 to ISBN-13", () => {
    expect(isbn10ToIsbn13("8408316087")).toBe("9788408316084");
  });

  it("normalizes 10-digit barcode to ISBN-13", () => {
    expect(normalizeIsbn("8408316087")).toBe("9788408316084");
  });
});
