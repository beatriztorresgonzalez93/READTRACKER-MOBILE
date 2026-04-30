import { normalizeBook, normalizeBookDetail } from "@/shared/lib/normalize-book";

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

  it("keeps unknown status as undefined and preserves null rating", () => {
    const normalized = normalizeBook({
      id: "abc",
      title: "Libro raro",
      status: "archived",
      rating: null,
      publishedDate: "fecha invalida",
    });

    expect(normalized.id).toBe("abc");
    expect(normalized.status).toBeUndefined();
    expect(normalized.rating).toBeNull();
    expect(normalized.publishedYear).toBeUndefined();
  });

  it("extracts year from text and normalizes tags/publisher aliases", () => {
    const normalized = normalizeBook({
      id: 7,
      title: "Fundacion",
      publicationDate: "edicion especial (1989)",
      review_tags: [" clasico ", "", "ciencia ficcion"],
      editorial: { nombre: "Debolsillo" },
      progress_percent: "45",
    });

    expect(normalized.publishedYear).toBe(1989);
    expect(normalized.tags).toEqual(["clasico", "ciencia ficcion"]);
    expect(normalized.publisher).toBe("Debolsillo");
    expect(normalized.progress).toBe(45);
  });

  it("returns base detail when raw input is not an object", () => {
    const normalized = normalizeBookDetail(null);
    expect(normalized).toEqual({ id: "", title: "Sin titulo" });
  });

  it("normalizes detailed fields from aliases", () => {
    const normalized = normalizeBookDetail({
      id: 15,
      title: "Solaris",
      progress: 30,
      descripcion: "Clasico de ciencia ficcion",
      review_text: "Muy inmersivo",
      read_count: "3",
      finished_at: "2026-04-01T10:20:00.000Z",
      read_times: "3 veces",
      favorite_citation: "No buscamos a otros mundos...",
      recommendation_text: "Lectura obligatoria",
    });

    expect(normalized.description).toBe("Clasico de ciencia ficcion");
    expect(normalized.reviewText).toBe("Muy inmersivo");
    expect(normalized.readCount).toBe(3);
    expect(normalized.readAt).toBe("2026-04-01T10:20:00.000Z");
    expect(normalized.timesRead).toBe("3 veces");
    expect(normalized.favoriteQuote).toBe("No buscamos a otros mundos...");
    expect(normalized.recommendation).toBe("Lectura obligatoria");
    expect(normalized.progressPercent).toBe(30);
  });

  it("falls back to base progress when detail progressPercent is missing", () => {
    const normalized = normalizeBookDetail({
      id: "b-1",
      title: "Hyperion",
      progress: 67,
      publisher: { invalid: true },
    });

    expect(normalized.progress).toBe(67);
    expect(normalized.progressPercent).toBe(67);
    expect(normalized.publisher).toBeUndefined();
  });
});
