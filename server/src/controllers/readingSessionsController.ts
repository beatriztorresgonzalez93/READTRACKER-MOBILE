// Controlador HTTP para listar, crear y borrar sesiones de lectura.
import { Request, Response } from "express";
import { logError } from "../logger";
import { ReadingSessionsService } from "../services/readingSessionsService";
import { sendApiError } from "../utils/apiResponse";

export class ReadingSessionsController {
  constructor(private readonly service: ReadingSessionsService) {}

  listSessions = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const sessions = await this.service.getSessions(userId);
      res.status(200).json({ data: sessions });
    } catch (error) {
      logError("ReadingSessionsController.listSessions", error);
      sendApiError(res, 500, "READING_SESSIONS_LIST_FAILED", "No se pudo cargar el historial de lectura");
    }
  };

  createSession = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const { bookId, currentPage, previousPage, recordedAt } = req.body as {
      bookId: string;
      currentPage: number;
      previousPage?: number | null;
      recordedAt?: string;
    };

    try {
      const session = await this.service.createSession(userId, {
        bookId: bookId.trim(),
        currentPage,
        previousPage: previousPage ?? null,
        recordedAt
      });
      if (!session) {
        sendApiError(res, 404, "BOOK_NOT_FOUND", "Libro no encontrado");
        return;
      }
      res.status(201).json({ data: session });
    } catch (error) {
      logError("ReadingSessionsController.createSession", error);
      sendApiError(res, 500, "READING_SESSION_CREATE_FAILED", "No se pudo guardar la sesión de lectura");
    }
  };

  deleteSession = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const sessionId = typeof req.params.id === "string" ? req.params.id : "";
    if (!sessionId) {
      sendApiError(res, 400, "INVALID_SESSION_ID", "El id de sesión no es válido");
      return;
    }

    try {
      const deleted = await this.service.deleteSession(userId, sessionId);
      if (!deleted) {
        sendApiError(res, 404, "SESSION_NOT_FOUND", "Sesión no encontrada");
        return;
      }
      res.status(200).json({ data: { id: sessionId } });
    } catch (error) {
      logError("ReadingSessionsController.deleteSession", error);
      sendApiError(res, 500, "READING_SESSION_DELETE_FAILED", "No se pudo borrar la sesión de lectura");
    }
  };
}
