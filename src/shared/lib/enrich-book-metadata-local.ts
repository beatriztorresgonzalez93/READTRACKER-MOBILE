// Enriquecimiento sin API key: género en español + traducción (MyMemory, máx. 500 chars por petición).
import { guessTextLanguage } from "@/shared/lib/lookup-book-by-isbn";
import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";

/** MyMemory limita la query a 500 caracteres. */
const MAX_CHUNK = 380;
const MAX_CHARS_TO_TRANSLATE = 900;

const GENRE_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /fantas[ií]a|fantasy|fantastique|high fantasy/i, label: "Fantasía" },
  { pattern: /ciencia ficción|science fiction|sci-?fi|sf\b/i, label: "Ciencia ficción" },
  { pattern: /romantico|romántic|romance|love stor/i, label: "Romance" },
  { pattern: /thriller|suspense|misterio|mistery|mystery|policiac|negro|noir/i, label: "Thriller" },
  { pattern: /históric|histori|history|época|siglo/i, label: "Novela histórica" },
  { pattern: /biograf|memorias|memoir/i, label: "Biografía" },
  { pattern: /infantil|juvenil|young adult|\bya\b|children/i, label: "Juvenil" },
  { pattern: /poes[ií]a|poetry/i, label: "Poesía" },
  { pattern: /teatro|drama\b/i, label: "Drama" },
  { pattern: /horror|terror|gótico|gothic/i, label: "Terror" },
  { pattern: /aventura|adventure/i, label: "Aventuras" },
  { pattern: /ensayo|essay|non-?fiction|no ficci/i, label: "Ensayo" },
  { pattern: /ficción|fiction|roman\b|novela|literatura/i, label: "Novela" },
];

type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  quotaFinished?: boolean;
};

export function isTranslationApiNoise(text: string): boolean {
  return /QUERY LENGTH LIMIT|MAX ALLOWED QUERY|MYMEMORY WARNING|AUTO\.SCALE/i.test(text);
}

export function sanitizeBookDescription(text: string): string {
  let value = text.trim();
  if (!value) return "";

  if (isTranslationApiNoise(value)) {
    value = value.replace(/QUERY LENGTH LIMIT EXCEEDED[^.]*\.?/gi, "").trim();
    value = value.replace(/MAX ALLOWED QUERY\s*:\s*\d+\s*CHARS/gi, "").trim();
  }

  if (/%[0-9A-F]{2}/i.test(value)) {
    try {
      value = decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
      /* mantener original */
    }
  }

  if (isTranslationApiNoise(value)) return "";
  return value.trim();
}

function splitForTranslation(text: string): string[] {
  const capped = text.slice(0, MAX_CHARS_TO_TRANSLATE);
  if (capped.length <= MAX_CHUNK) return [capped];

  const chunks: string[] = [];
  let rest = capped;
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf(". ", MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = rest.lastIndexOf(" ", MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = MAX_CHUNK;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function translateChunk(text: string, langPair: string): Promise<string | null> {
  if (text.length > MAX_CHUNK) return null;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as MyMemoryResponse;
    if (data.quotaFinished) return null;

    const translated = sanitizeBookDescription(data.responseData?.translatedText ?? "");
    if (!translated || isTranslationApiNoise(translated)) return null;
    if (translated.toUpperCase() === text.toUpperCase()) return null;
    return translated;
  } catch {
    return null;
  }
}

export async function translateTextToSpanish(text: string): Promise<string> {
  const trimmed = sanitizeBookDescription(text);
  if (!trimmed) return "";

  const lang = guessTextLanguage(trimmed);
  if (lang === "es") return trimmed;

  const langPair = lang === "fr" ? "fr|es" : "en|es";
  const chunks = splitForTranslation(trimmed);
  const parts: string[] = [];

  for (const chunk of chunks) {
    const translated = await translateChunk(chunk, langPair);
    if (translated) parts.push(translated);
  }

  if (parts.length === 0) return "";

  const joined = sanitizeBookDescription(parts.join(" "));
  return guessTextLanguage(joined) === "es" ? joined : "";
}

export function normalizeGenreToSpanish(raw: string): string {
  const input = raw.trim();
  if (!input) return "";

  const segments = input.split(/[,;/|]/).map((s) => s.trim()).filter(Boolean);
  const haystack = segments.length > 0 ? segments : [input];

  if (haystack.length === 1) {
    const only = haystack[0];
    const looksSpanish = /[ñáéíóú¿¡]/i.test(only) || /^[a-záéíóúñü\s]+$/i.test(only);
    if (looksSpanish && only.length <= 48 && !/\b(fiction|fantasy|mystery|thriller|science fiction)\b/i.test(only)) {
      return only;
    }
  }

  let bestLabel = "";
  let bestRuleIndex = GENRE_RULES.length;

  for (const segment of haystack) {
    for (let i = 0; i < GENRE_RULES.length; i++) {
      if (GENRE_RULES[i].pattern.test(segment) && i < bestRuleIndex) {
        bestRuleIndex = i;
        bestLabel = GENRE_RULES[i].label;
      }
    }
  }

  if (bestLabel) return bestLabel;

  const first = haystack[0] ?? input;
  if (/[ñáéíóú¿¡]/i.test(first) && first.length <= 40 && !/fiction|fantasy|mystery|thriller/i.test(first)) {
    return first;
  }

  return "Novela";
}

export async function enrichBookMetadataLocally(
  metadata: BookMetadataFromIsbn,
): Promise<BookMetadataFromIsbn> {
  const genre = normalizeGenreToSpanish(metadata.genre);
  let description = sanitizeBookDescription(metadata.description);

  if (description && guessTextLanguage(description) !== "es") {
    const translated = await translateTextToSpanish(description);
    if (translated) {
      description = translated;
    } else {
      description = "";
    }
  }

  return {
    ...metadata,
    genre: genre || metadata.genre,
    description,
  };
}
