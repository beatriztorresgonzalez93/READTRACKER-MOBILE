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
  return `Eres un bibliotecario español. El usuario escaneó el ISBN ${isbn} pero no hay datos en bases públicas.

Con tu conocimiento del libro asociado a ese ISBN (edición en español si existe), devuelve ÚNICAMENTE JSON con:
- "title", "author", "publisher", "pages" (solo dígitos o ""), "publishedYear" (4 dígitos o "")
- "genre": UN solo género en español
- "description": sinopsis en español, 2-4 frases, máximo 550 caracteres

Si no identificas el libro con certeza razonable, devuelve "title": "" y el resto vacío.`;
}

export class BookMetadataEnrichmentService {
  async enrich(input: BookMetadataInput): Promise<BookMetadataEnriched> {
    if (!isAiBookMetadataConfigured()) {
      throw new AiEnrichmentNotConfiguredError();
    }
    if (!input.title?.trim()) {
      throw new AiEnrichmentError("El título es obligatorio para enriquecer metadatos");
    }

    const parsed = await this.completeJsonPrompt(buildPrompt(input));
    return mergeWithInput(input, parsed);
  }
}
