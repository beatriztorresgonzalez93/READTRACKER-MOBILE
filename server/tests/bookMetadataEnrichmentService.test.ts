import { describe, expect, it } from "vitest";

import { normalizeAiBookPayload } from "../src/services/bookMetadataEnrichmentService";

describe("normalizeAiBookPayload", () => {
  it("coerces numeric pages and year from Groq-style JSON", () => {
    const result = normalizeAiBookPayload({
      title: "Alas de sangre",
      author: "Rebecca Yarros",
      pages: 792,
      publishedYear: 2024,
      genre: "Fantasía, Romance",
      description: "Una joven entra en el colegio de jinetes de dragones.",
    });

    expect(result).not.toBeNull();
    expect(result?.pages).toBe("792");
    expect(result?.publishedYear).toBe("2024");
    expect(result?.genre).toBe("Fantasía");
  });

  it("accepts Spanish keys and fills title from input when AI omits it", () => {
    const result = normalizeAiBookPayload(
      {
        titulo: "",
        autor: "Autor Test",
        editorial: "Planeta",
        paginas: "300",
        genero: "Novela",
        descripcion: "Sinopsis breve en español.",
      },
      { title: "Libro guardado", author: "", isbn: "9788408316084" },
    );

    expect(result?.title).toBe("Libro guardado");
    expect(result?.publisher).toBe("Planeta");
  });
});
