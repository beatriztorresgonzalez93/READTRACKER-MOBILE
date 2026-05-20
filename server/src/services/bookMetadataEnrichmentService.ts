// Normaliza metadatos de libro a español (género único, sinopsis) vía IA.
import { z } from "zod";
import { env, isAiBookMetadataConfigured } from "../config/env";
import { logError, logInfo } from "../logger";

export type BookMetadataInput = {
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  pages?: string;
  publishedYear?: string;
  genre?: string;
  description?: string;
};

export type BookMetadataEnriched = {
  title: string;
  author: string;
  publisher: string;
  pages: string;
  publishedYear: string;
  genre: string;
  description: string;
};

const enrichedSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(400),
  publisher: z.string().max(200),
  pages: z.string().max(10),
  publishedYear: z.string().max(4),
  genre: z.string().max(80),
  description: z.string().max(900),
});

function pickString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function pickGenre(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => pickString(v)).filter(Boolean).slice(0, 1).join("");
  }
  const raw = pickString(value);
  if (!raw) return "";
  return raw.split(/[,;/|]/)[0]?.trim() ?? "";
}

function normalizePages(value: unknown): string {
  const digits = pickString(value).replace(/\D/g, "");
  if (digits) return digits.slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return String(Math.round(value)).slice(0, 10);
  }
  return "";
}

function normalizeYear(value: unknown): string {
  const fromString = pickString(value).replace(/\D/g, "");
  const match = fromString.match(/\b(19|20)\d{2}\b/);
  if (match) return match[0];
  if (typeof value === "number" && value >= 1000 && value <= 2100) {
    return String(Math.round(value));
  }
  return "";
}

function normalizeDescription(value: unknown): string {
  const text = pickString(value);
  return text.length > 900 ? text.slice(0, 900) : text;
}

/** Acepta respuestas Groq/Gemini con tipos sueltos (números, claves en español, etc.). */
export function normalizeAiBookPayload(
  data: unknown,
  input?: BookMetadataInput,
): z.infer<typeof enrichedSchema> | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const title =
    pickString(row.title) ||
    pickString(row.titulo) ||
    pickString(row.Título) ||
    input?.title?.trim() ||
    "";
  const author =
    pickString(row.author) ||
    pickString(row.autor) ||
    pickString(row.Authors) ||
    input?.author?.trim() ||
    "";

  const candidate = {
    title,
    author,
    publisher:
      pickString(row.publisher) ||
      pickString(row.editorial) ||
      pickString(row.publisher_name) ||
      input?.publisher?.trim() ||
      "",
    pages: normalizePages(row.pages ?? row.pageCount ?? row.paginas),
    publishedYear: normalizeYear(
      row.publishedYear ?? row.published_year ?? row.year ?? row.publication_year,
    ),
    genre: pickGenre(row.genre ?? row.genero ?? row.categories) || input?.genre?.trim() || "",
    description: normalizeDescription(
      row.description ?? row.descripcion ?? row.synopsis ?? row.sinopsis,
    ),
  };

  const parsed = enrichedSchema.safeParse(candidate);
  if (!parsed.success) {
    logError("bookMetadataEnrichment.normalize", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

export class AiEnrichmentNotConfiguredError extends Error {
  constructor() {
    super("Enriquecimiento con IA no configurado en el servidor");
    this.name = "AiEnrichmentNotConfiguredError";
  }
}

export class AiEnrichmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiEnrichmentError";
  }
}

function textLooksNonSpanish(text: string): boolean {
  const sample = text.slice(0, 400).toLowerCase();
  const frenchHits = (sample.match(/\b(le|la|les|des|une|dans|pour|avec|roman|livre|été)\b/g) ?? []).length;
  const englishHits = (sample.match(/\b(the|and|with|from|this|book|novel|was)\b/g) ?? []).length;
  const spanishHits = (sample.match(/\b(el|la|los|de|que|con|una|por|libro|novela)\b/g) ?? []).length;
  if (/[ñáéíóú¿¡]/i.test(text) && spanishHits >= 2) return false;
  return frenchHits >= 2 || englishHits >= 3;
}

function buildPrompt(input: BookMetadataInput): string {
  return `Eres un bibliotecario español. Recibes metadatos de un libro obtenidos de APIs (a veces en inglés o francés).

REGLAS CRÍTICAS:
- Si "title" y "author" de entrada ya tienen valor, CÓPIALOS TAL CUAL en la salida (mismo libro, mismo ISBN).
- La sinopsis y el género deben ser del MISMO libro que el título de entrada; nunca sustituyas por otro título famoso.
- "description" DEBE estar 100% en español (España). Nunca devuelvas francés ni inglés.
- Si la descripción de entrada está en otro idioma, REESCRÍBELA en español (no copies el texto original).
- "genre": exactamente UN género en español, sin listas ni comas.

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown) con estas claves:
- "title": título; no traduzcas nombres propios si ya están en español
- "author": autor(es); mantén nombres correctos
- "publisher": editorial; en español si aplica
- "pages": solo dígitos como string, o "" si desconocido
- "publishedYear": año de 4 dígitos o ""
- "genre": UN solo género literario general EN ESPAÑOL (ej. "Novela", "Fantasía", "Thriller")
- "description": sinopsis en español, 2-4 frases, máximo 550 caracteres, sin spoilers importantes

Si un campo de entrada ya está bien en español, consérvalo. Rellena lo que falte.

ISBN: ${input.isbn ?? "desconocido"}
Datos de entrada:
${JSON.stringify(
  {
    title: input.title,
    author: input.author,
    publisher: input.publisher ?? "",
    pages: input.pages ?? "",
    publishedYear: input.publishedYear ?? "",
    genre: input.genre ?? "",
    description: (input.description ?? "").slice(0, 1200),
  },
  null,
  2,
)}`;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AiEnrichmentError("La IA no devolvió JSON válido");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callOpenAiCompatible(
  prompt: string,
  options: { apiKey: string; model: string; baseUrl: string; providerName: string },
): Promise<string> {
  const response = await fetch(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Respondes solo con JSON. Campos en español para género y descripción.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AiEnrichmentError(
      `${options.providerName} error ${response.status}: ${body.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new AiEnrichmentError(`${options.providerName} devolvió respuesta vacía`);
  }
  return content;
}

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AiEnrichmentError(`Gemini error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new AiEnrichmentError("Gemini devolvió respuesta vacía");
  }
  return text;
}

function resolveDescription(inputDescription: string, aiDescription: string): string {
  const ai = aiDescription.trim();
  const original = inputDescription.trim();
  if (ai.length >= 20) return ai;
  if (ai.length > 0 && original && textLooksNonSpanish(original)) return ai;
  return ai || original;
}

function mergeWithInput(
  input: BookMetadataInput,
  enriched: z.infer<typeof enrichedSchema>,
): BookMetadataEnriched {
  return {
    title: enriched.title.trim() || input.title.trim(),
    author: enriched.author.trim() || input.author.trim(),
    publisher: enriched.publisher.trim() || (input.publisher ?? "").trim(),
    pages: enriched.pages.trim() || (input.pages ?? "").trim(),
    publishedYear: enriched.publishedYear.trim() || (input.publishedYear ?? "").trim(),
    genre: enriched.genre.trim() || (input.genre ?? "").trim(),
    description: resolveDescription(input.description ?? "", enriched.description),
  };
}

function buildDiscoverFromIsbnPrompt(isbn: string): string {
  return `Eres un bibliotecario español. El usuario escaneó el ISBN-13 ${isbn}; no hay datos en bases públicas.

IMPORTANTE:
- Responde SOLO con la edición cuyo ISBN-13 es exactamente ${isbn}.
- NO sustituyas otro libro aunque lo conozcas bien (ej. "El laberinto del fauno", "Harry Potter", etc.).
- Si no reconoces este ISBN concreto, devuelve "title": "" y el resto vacío.

Ejemplos de ISBN → libro (solo si coincide tu ISBN):
- 9788408316084 → "Alas de sangre", Rebecca Yarros, Booket (Empíreo 1)

Devuelve ÚNICAMENTE JSON con:
- "title", "author", "publisher", "pages" (solo dígitos o ""), "publishedYear" (4 dígitos o "")
- "genre": UN solo género en español
- "description": sinopsis en español, 2-4 frases, máximo 550 caracteres`;
}

async function runAiJsonPrompt(prompt: string): Promise<string> {
  let rawText: string | null = null;
  const fallbacksConfigured = Boolean(env.openaiApiKey || env.geminiApiKey);

  if (env.groqApiKey) {
    try {
      rawText = await callOpenAiCompatible(prompt, {
        apiKey: env.groqApiKey,
        model: env.groqModel,
        baseUrl: "https://api.groq.com/openai/v1",
        providerName: "Groq",
      });
      logInfo("bookMetadataEnrichment.provider", { provider: "groq" });
    } catch (error) {
      logError("bookMetadataEnrichment.groq", error);
      if (!fallbacksConfigured) throw error;
    }
  }

  if (!rawText && env.openaiApiKey) {
    try {
      rawText = await callOpenAiCompatible(prompt, {
        apiKey: env.openaiApiKey,
        model: env.openaiModel,
        baseUrl: "https://api.openai.com/v1",
        providerName: "OpenAI",
      });
      logInfo("bookMetadataEnrichment.provider", { provider: "openai" });
    } catch (error) {
      logError("bookMetadataEnrichment.openai", error);
      if (!env.geminiApiKey) throw error;
    }
  }

  if (!rawText && env.geminiApiKey) {
    rawText = await callGemini(prompt);
    logInfo("bookMetadataEnrichment.provider", { provider: "gemini" });
  }

  if (!rawText) {
    throw new AiEnrichmentError("No se pudo obtener respuesta de la IA");
  }

  return rawText;
}

function parseEnrichedJson(
  rawText: string,
  input?: BookMetadataInput,
): z.infer<typeof enrichedSchema> {
  let extracted: unknown;
  try {
    extracted = extractJsonObject(rawText);
  } catch (error) {
    throw error instanceof AiEnrichmentError
      ? error
      : new AiEnrichmentError("La IA no devolvió JSON válido");
  }

  const normalized = normalizeAiBookPayload(extracted, input);
  if (normalized) return normalized;

  throw new AiEnrichmentError("JSON de IA con formato inválido");
}

async function runAiJsonPromptWithRetry(
  prompt: string,
  input?: BookMetadataInput,
): Promise<z.infer<typeof enrichedSchema>> {
  const strictSuffix =
    "\n\nIMPORTANTE: Responde ÚNICAMENTE un objeto JSON (sin markdown). " +
    'Todas las claves en inglés: title, author, publisher, pages, publishedYear, genre, description. ' +
    'pages y publishedYear como strings (ej. "432", "2024"). genre: un solo género en español.';

  try {
    return parseEnrichedJson(await runAiJsonPrompt(prompt + strictSuffix), input);
  } catch (firstError) {
    if (!(firstError instanceof AiEnrichmentError)) throw firstError;
    logInfo("bookMetadataEnrichment.retry", { reason: firstError.message });
    return parseEnrichedJson(
      await runAiJsonPrompt(
        `${prompt}\n\nTu respuesta anterior no era JSON válido. Repite solo el objeto JSON con las claves indicadas.`,
      ),
      input,
    );
  }
}

export class BookMetadataEnrichmentService {
  async enrich(input: BookMetadataInput): Promise<BookMetadataEnriched> {
    if (!isAiBookMetadataConfigured()) {
      throw new AiEnrichmentNotConfiguredError();
    }
    if (!input.title?.trim()) {
      throw new AiEnrichmentError("El título es obligatorio para enriquecer metadatos");
    }

    const parsed = await runAiJsonPromptWithRetry(buildPrompt(input), input);
    return mergeWithInput(input, parsed);
  }

  async discoverFromIsbn(isbn: string): Promise<BookMetadataEnriched> {
    if (!isAiBookMetadataConfigured()) {
      throw new AiEnrichmentNotConfiguredError();
    }

    const parsed = await runAiJsonPromptWithRetry(buildDiscoverFromIsbnPrompt(isbn));
    const title = parsed.title.trim();
    if (!title) {
      throw new AiEnrichmentError("No se identificó ningún libro para este ISBN");
    }

    return {
      title,
      author: parsed.author.trim(),
      publisher: parsed.publisher.trim(),
      pages: parsed.pages.trim(),
      publishedYear: parsed.publishedYear.trim(),
      genre: parsed.genre.trim(),
      description: parsed.description.trim(),
    };
  }
}
