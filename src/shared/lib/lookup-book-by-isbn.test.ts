import {
  flattenDescription,
  guessTextLanguage,
  mergeManyPartials,
  pickBestDescription,
} from "@/shared/lib/lookup-book-by-isbn";

describe("lookup-book-by-isbn", () => {
  it("flattens Open Library description object", () => {
    expect(flattenDescription({ value: "<p>Hola</p> mundo" })).toBe("Hola\n mundo");
  });

  it("detects Spanish vs French", () => {
    expect(guessTextLanguage("El joven recorre Barcelona en busca de un libro perdido.")).toBe("es");
    expect(
      guessTextLanguage("Le jeune homme parcourt Barcelone à la recherche d'un livre disparu."),
    ).toBe("fr");
  });

  it("prefers Spanish description over longer French", () => {
    const chosen = pickBestDescription([
      {
        text: "Le jeune homme parcourt Barcelone à la recherche d'un livre très ancien et mystérieux dans la ville.",
        lang: "fr",
      },
      {
        text: "Un joven recorre Barcelona en busca de un libro antiguo.",
        lang: "es",
      },
    ]);
    expect(chosen).toContain("joven");
  });

  it("merges metadata and picks best description", () => {
    const merged = mergeManyPartials("9780000000000", [
      { isbn: "9780000000000", title: "Libro", description: "Courte.", descriptionLang: "fr" },
      {
        isbn: "9780000000000",
        title: "Libro",
        description: "Sinopsis en español con más detalle del argumento.",
        descriptionLang: "es",
      },
    ]);
    expect(merged.description).toContain("español");
  });
});
