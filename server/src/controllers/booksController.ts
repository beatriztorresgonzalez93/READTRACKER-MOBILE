// Capa HTTP: recibe req/res, llama al servicio y devuelve respuestas JSON.
import { Request, Response } from "express";
import { logError } from "../logger";
import { BooksService } from "../services/booksService";
import { BookListPageFilters, BookSortKey } from "../types/book";
import { sendApiError } from "../utils/apiResponse";

const SORT_VALUES: BookSortKey[] = ["recientes", "titulo", "autor", "genero", "valoracion"];
const SHELF_VALUES = ["todos", "favoritos", "pendiente", "leyendo", "leido"] as const;
const HOOK_STATUS_VALUES = ["todos", "pendiente", "leyendo", "leido"] as const;

const parseIntBounded = (raw: unknown, fallback: number, min: number, max: number) => {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : typeof raw === "number" ? raw : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export class BooksController {
  constructor(private readonly service: BooksService) {}

  private getSingleQueryValue(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const first = value.find((v): v is string => typeof v === "string");
      return first;
    }
    return undefined;
  }

  private getSingleParamValue(value: unknown): string | null {
    return typeof value === "string" ? value : null;
  }

  getBooks = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const search = this.getSingleQueryValue(req.query.search)?.trim();
      const hookStatus = this.getSingleQueryValue(req.query.status)?.trim() ?? "todos";
      const shelf = this.getSingleQueryValue(req.query.shelf)?.trim() ?? "todos";
      const genreRaw = this.getSingleQueryValue(req.query.genre)?.trim();
      const sortRaw = this.getSingleQueryValue(req.query.sort)?.trim() ?? "recientes";
      const limit = parseIntBounded(req.query.limit, 12, 1, 100);
      const offset = parseIntBounded(req.query.offset, 0, 0, 1_000_000);

      if (!HOOK_STATUS_VALUES.includes(hookStatus as (typeof HOOK_STATUS_VALUES)[number])) {
        sendApiError(res, 400, "INVALID_BOOKS_STATUS", "Parámetro status no válido");
        return;
      }
      if (!SHELF_VALUES.includes(shelf as (typeof SHELF_VALUES)[number])) {
        sendApiError(res, 400, "INVALID_BOOKS_SHELF", "Parámetro shelf no válido");
        return;
      }
      if (!SORT_VALUES.includes(sortRaw as BookSortKey)) {
        sendApiError(res, 400, "INVALID_BOOKS_SORT", "Parámetro sort no válido");
        return;
      }
      if (genreRaw && genreRaw.length > 200) {
        sendApiError(res, 400, "INVALID_BOOKS_GENRE", "El género indicado es demasiado largo");
        return;
      }

      const filters: BookListPageFilters = {
        search: search || undefined,
        hookStatus,
        shelf,
        genre: genreRaw || null,
        sort: sortRaw as BookSortKey
      };

      const { rows, total } = await this.service.getBooksPage(userId, filters, limit, offset);
      res.status(200).json({
        data: rows,
        meta: { total, limit, offset }
      });
    } catch (err) {
      logError("BooksController.getBooks", err);
      sendApiError(res, 500, "BOOKS_LIST_FAILED", "No se pudieron cargar los libros");
    }
  };

  getBooksSummary = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const summary = await this.service.getLibrarySummary(userId);
      res.status(200).json({ data: summary });
    } catch (err) {
      logError("BooksController.getBooksSummary", err);
      sendApiError(res, 500, "BOOKS_SUMMARY_FAILED", "No se pudo cargar el resumen de la biblioteca");
    }
  };

  getBookById = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_BOOK_ID", "El id del libro no es válido");
      return;
    }

    try {
      const book = await this.service.getBookById(id, userId);
      if (!book) {
        sendApiError(res, 404, "BOOK_NOT_FOUND", "Libro no encontrado");
        return;
      }
      res.status(200).json({ data: book });
    } catch (err) {
      logError("BooksController.getBookById", err);
      sendApiError(res, 500, "BOOK_LOAD_FAILED", "No se pudo cargar el libro");
    }
  };

  createBook = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const book = await this.service.createBook(req.body, userId);
      res.status(201).json({ data: book });
    } catch (err) {
      logError("BooksController.createBook", err);
      sendApiError(res, 500, "BOOK_CREATE_FAILED", "No se pudo crear el libro");
    }
  };

  updateBook = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_BOOK_ID", "El id del libro no es válido");
      return;
    }

    try {
      const updated = await this.service.updateBook(id, req.body, userId);
      if (!updated) {
        sendApiError(res, 404, "BOOK_NOT_FOUND", "Libro no encontrado");
        return;
      }
      res.status(200).json({ data: updated });
    } catch (err) {
      logError("BooksController.updateBook", err);
      sendApiError(res, 500, "BOOK_UPDATE_FAILED", "No se pudo actualizar el libro");
    }
  };

  deleteBook = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_BOOK_ID", "El id del libro no es válido");
      return;
    }

    try {
      const deleted = await this.service.deleteBook(id, userId);
      if (!deleted) {
        sendApiError(res, 404, "BOOK_NOT_FOUND", "Libro no encontrado");
        return;
      }
      res.status(200).json({ data: { id } });
    } catch (err) {
      logError("BooksController.deleteBook", err);
      sendApiError(res, 500, "BOOK_DELETE_FAILED", "No se pudo eliminar el libro");
    }
  };
}
