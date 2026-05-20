// POST /books/metadata/enrich — sinopsis y género en español vía IA.
import { Request, Response } from "express";
import { logError } from "../logger";
import {
  AiEnrichmentError,
  AiEnrichmentNotConfiguredError,
  BookMetadataEnrichmentService,
} from "../services/bookMetadataEnrichmentService";
import { sendApiError } from "../utils/apiResponse";

export class BookMetadataController {
  constructor(private readonly service: BookMetadataEnrichmentService) {}

  enrich = async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";
    const isbn = typeof body.isbn === "string" ? body.isbn.trim() : "";

    if (!title) {
      if (!isbn) {
        sendApiError(res, 400, "VALIDATION_ERROR", "El título o el ISBN es obligatorio");
        return;
      }
      try {
        const data = await this.service.discoverFromIsbn(isbn);
        res.status(200).json({ data });
        return;
      } catch (error) {
        if (error instanceof AiEnrichmentNotConfiguredError) {
          sendApiError(res, 503, "AI_NOT_CONFIGURED", error.message);
          return;
        }
        if (error instanceof AiEnrichmentError) {
          sendApiError(res, 404, "BOOK_NOT_FOUND", error.message);
          return;
        }
        logError("BookMetadataController.enrich.discover", error);
        sendApiError(res, 500, "INTERNAL_ERROR", "No se pudo buscar el libro con IA");
        return;
      }
    }

    try {
      const data = await this.service.enrich({
        isbn: isbn || undefined,
        title,
        author,
        publisher: typeof body.publisher === "string" ? body.publisher : "",
        pages: typeof body.pages === "string" ? body.pages : "",
        publishedYear: typeof body.publishedYear === "string" ? body.publishedYear : "",
        genre: typeof body.genre === "string" ? body.genre : "",
        description: typeof body.description === "string" ? body.description : "",
      });
      res.status(200).json({ data });
    } catch (error) {
      if (error instanceof AiEnrichmentNotConfiguredError) {
        sendApiError(
          res,
          503,
          "AI_NOT_CONFIGURED",
          "El servidor no tiene configurada una clave de IA (GROQ_API_KEY, OPENAI_API_KEY o GEMINI_API_KEY).",
        );
        return;
      }
      if (error instanceof AiEnrichmentError) {
        sendApiError(res, 502, "AI_ENRICHMENT_FAILED", error.message);
        return;
      }
      logError("BookMetadataController.enrich", error);
      sendApiError(res, 500, "INTERNAL_ERROR", "No se pudieron enriquecer los metadatos");
    }
  };

  discoverFromIsbn = async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const isbn = typeof body.isbn === "string" ? body.isbn.trim() : "";
    if (!isbn) {
      sendApiError(res, 400, "VALIDATION_ERROR", "El ISBN es obligatorio");
      return;
    }

    try {
      const data = await this.service.discoverFromIsbn(isbn);
      res.status(200).json({ data });
    } catch (error) {
      if (error instanceof AiEnrichmentNotConfiguredError) {
        sendApiError(res, 503, "AI_NOT_CONFIGURED", error.message);
        return;
      }
      if (error instanceof AiEnrichmentError) {
        sendApiError(res, 404, "BOOK_NOT_FOUND", error.message);
        return;
      }
      logError("BookMetadataController.discoverFromIsbn", error);
      sendApiError(res, 500, "INTERNAL_ERROR", "No se pudo buscar el libro con IA");
    }
  };
}
