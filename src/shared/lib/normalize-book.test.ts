import { normalizeBook } from "@/shared/lib/normalize-book";

describe("normalizeBook", () => {
  it("normalizes status aliases and publication year", () => {
    const normalized = normalizeBook({
      id: 42,
      title: "Dune",
      status: "completed",
      publishedDate: "1965-06-01",
      cover_url: "/covers/dune.jpg",
    });

    expect(normalized.id).toBe("42");
    expect(normalized.status).toBe("leido");
    expect(normalized.publishedYear).toBe(1965);
    expect(normalized.coverUrl).toBe("https://readtracker-api.onrender.com/covers/dune.jpg");
  });

  it("falls back to default title when missing", () => {
    const normalized = normalizeBook({});
    expect(normalized.title).toBe("Sin titulo");
  });
});
