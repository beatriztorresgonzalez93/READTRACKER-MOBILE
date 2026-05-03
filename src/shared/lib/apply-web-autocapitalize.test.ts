import { applyWebAutoCapitalize } from "@/shared/lib/apply-web-autocapitalize";

describe("applyWebAutoCapitalize", () => {
  it("sentences: primera letra y tras punto", () => {
    expect(applyWebAutoCapitalize("hola mundo", "sentences")).toBe("Hola mundo");
    expect(applyWebAutoCapitalize("Hola. mundo", "sentences")).toBe("Hola. Mundo");
  });

  it("sentences: varias lineas", () => {
    expect(applyWebAutoCapitalize("primera.\nsegunda linea", "sentences")).toBe("Primera.\nSegunda linea");
  });

  it("words: inicio de cada palabra", () => {
    expect(applyWebAutoCapitalize("gabriel garcía", "words")).toBe("Gabriel García");
    expect(applyWebAutoCapitalize("anna-maria lopez", "words")).toBe("Anna-Maria Lopez");
  });

  it("none y characters", () => {
    expect(applyWebAutoCapitalize("AbC", "none")).toBe("AbC");
    expect(applyWebAutoCapitalize("abc", "characters")).toBe("ABC");
  });
});
