// Replica aproximada de autoCapitalize de iOS/Android en navegador (escritorio ignora el atributo nativo).
import type { TextInputProps } from "react-native";

type Mode = NonNullable<TextInputProps["autoCapitalize"]>;

const LEAD_LOWER = /^[a-záéíóúñüàèìòùâêîôûç]/;
const AFTER_SENTENCE = /([.!?])(\s+)([a-záéíóúñüàèìòùâêîôûç])/gu;
/** Tras espacio o guión (nombres compuestos), siguiente letra minúscula → mayúscula inicial de palabra */
const WORD_BOUNDARY = /(^|[\s-])([a-záéíóúñüàèìòùâêîôûç])/gu;

function applySentenceLine(line: string): string {
  if (!line) return line;
  let s = line;
  if (LEAD_LOWER.test(s)) {
    s = s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
  }
  return s.replace(AFTER_SENTENCE, (_, punct, space, letter) => punct + space + letter.toLocaleUpperCase("es"));
}

export function applyWebAutoCapitalize(text: string, mode: Mode): string {
  if (mode === "none") return text;
  if (mode === "characters") return text.toLocaleUpperCase("es");
  if (mode === "words") {
    return text.replace(WORD_BOUNDARY, (_, sep, letter) => sep + letter.toLocaleUpperCase("es"));
  }
  // sentences
  return text.split("\n").map(applySentenceLine).join("\n");
}
