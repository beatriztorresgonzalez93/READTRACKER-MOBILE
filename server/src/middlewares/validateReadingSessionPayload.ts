// Valida el payload de creación de sesión para mantener contrato API estable.
import { NextFunction, Request, Response } from "express";
import { sendApiError } from "../utils/apiResponse";

export const validateCreateReadingSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { bookId, currentPage, previousPage, recordedAt } = req.body as {
    bookId?: unknown;
    currentPage?: unknown;
    previousPage?: unknown;
    recordedAt?: unknown;
  };

  if (typeof bookId !== "string" || !bookId.trim()) {
    sendApiError(res, 400, "INVALID_BOOK_ID", "bookId es obligatorio");
    return;
  }
  if (typeof currentPage !== "number" || !Number.isInteger(currentPage) || currentPage < 0) {
    sendApiError(res, 400, "INVALID_CURRENT_PAGE", "currentPage debe ser un entero mayor o igual que 0");
    return;
  }
  if (
    previousPage !== undefined &&
    previousPage !== null &&
    (typeof previousPage !== "number" || !Number.isInteger(previousPage) || previousPage < 0)
  ) {
    sendApiError(res, 400, "INVALID_PREVIOUS_PAGE", "previousPage debe ser un entero mayor o igual que 0");
    return;
  }
  if (
    recordedAt !== undefined &&
    (typeof recordedAt !== "string" || Number.isNaN(new Date(recordedAt).getTime()))
  ) {
    sendApiError(res, 400, "INVALID_RECORDED_AT", "recordedAt no tiene un formato de fecha válido");
    return;
  }

  next();
};
