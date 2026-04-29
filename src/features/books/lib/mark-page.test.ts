import {
  buildReadingSessionPayload,
  calculateCompletion,
  parseNextPageInput,
} from "@/features/books/lib/mark-page";

describe("mark-page logic", () => {
  it("calculates bounded completion percentage", () => {
    expect(calculateCompletion(120, 500)).toBe(24);
    expect(calculateCompletion(600, 500)).toBe(100);
    expect(calculateCompletion(-20, 500)).toBe(0);
  });

  it("validates and normalizes page input", () => {
    expect(parseNextPageInput("120", 500)).toBe(120);
    expect(parseNextPageInput("0", 500)).toBeNull();
    expect(parseNextPageInput("501", 500)).toBeNull();
    expect(parseNextPageInput("abc", 500)).toBeNull();
  });

  it("builds session payload with protected previous page", () => {
    expect(buildReadingSessionPayload(120, 50)).toEqual({
      currentPage: 120,
      previousPage: 50,
    });
    expect(buildReadingSessionPayload(10, -5)).toEqual({
      currentPage: 10,
      previousPage: 0,
    });
  });
});
