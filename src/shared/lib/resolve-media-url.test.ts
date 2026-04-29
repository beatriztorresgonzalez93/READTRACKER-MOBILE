import { resolveBookCoverUrl } from "@/shared/lib/resolve-media-url";

describe("resolveBookCoverUrl", () => {
  it("returns null for empty input", () => {
    expect(resolveBookCoverUrl("")).toBeNull();
    expect(resolveBookCoverUrl(undefined)).toBeNull();
  });

  it("keeps absolute urls unchanged", () => {
    const url = "https://cdn.example.com/cover.jpg";
    expect(resolveBookCoverUrl(url)).toBe(url);
  });

  it("resolves relative paths against API origin", () => {
    expect(resolveBookCoverUrl("/uploads/cover.jpg")).toBe(
      "https://readtracker-api.onrender.com/uploads/cover.jpg",
    );
    expect(resolveBookCoverUrl("uploads/cover.jpg")).toBe(
      "https://readtracker-api.onrender.com/uploads/cover.jpg",
    );
  });
});
