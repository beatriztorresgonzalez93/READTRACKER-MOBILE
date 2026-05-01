// Validaciones básicas de payload para crear y actualizar libros.
import { Request, Response, NextFunction } from "express";
import { ReadingStatus } from "../types/book";
import { sendApiError } from "../utils/apiResponse";

const validStatuses: ReadingStatus[] = ["pendiente", "leyendo", "leido"];

const isValidStatus = (status: unknown): status is ReadingStatus =>
  typeof status === "string" && validStatuses.includes(status as ReadingStatus);

const updateBookKeys = [
  "title",
  "author",
  "publisher",
  "genre",
  "pages",
  "publicationYear",
  "status",
  "rating",
  "review",
  "reviewTags",
  "synopsis",
  "readAt",
  "timesRead",
  "favoriteQuote",
  "wouldRecommend",
  "progress",
  "currentPage",
  "lastPageMarkedAt",
  "coverUrl",
  "isFavorite"
] as const;

export const validateCreateBook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, author, publisher, genre, pages, publicationYear, status, rating, progress, currentPage, lastPageMarkedAt, reviewTags, synopsis, readAt, timesRead, favoriteQuote, wouldRecommend, isFavorite } = req.body;

  if (!title || !author || !publisher || !genre || !isValidStatus(status)) {
    sendApiError(
      res,
      400,
      "INVALID_BOOK_REQUIRED_FIELDS",
      "Título, autor, editorial, género y estado son obligatorios"
    );
    return;
  }

  if (rating !== undefined && (rating < 0 || rating > 5)) {
    sendApiError(res, 400, "INVALID_RATING", "La calificación debe estar entre 0 y 5");
    return;
  }

  if (progress !== undefined && (progress < 0 || progress > 100)) {
    sendApiError(res, 400, "INVALID_PROGRESS", "El progreso debe estar entre 0 y 100");
    return;
  }

  if (currentPage !== undefined && (typeof currentPage !== "number" || currentPage < 0 || currentPage > 20000)) {
    sendApiError(res, 400, "INVALID_CURRENT_PAGE", "La página actual no es válida");
    return;
  }

  if (lastPageMarkedAt !== undefined && Number.isNaN(new Date(String(lastPageMarkedAt)).getTime())) {
    sendApiError(res, 400, "INVALID_LAST_PAGE_MARKED_AT", "La fecha de marcado no es válida");
    return;
  }

  if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
    sendApiError(res, 400, "INVALID_IS_FAVORITE", "El campo favorito no es válido");
    return;
  }

  if (synopsis !== undefined && typeof synopsis !== "string") {
    sendApiError(res, 400, "INVALID_SYNOPSIS", "La sinopsis no es válida");
    return;
  }

  if (reviewTags !== undefined) {
    if (!Array.isArray(reviewTags) || reviewTags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 40)) {
      sendApiError(res, 400, "INVALID_REVIEW_TAGS", "Las etiquetas de reseña no son válidas");
      return;
    }
  }

  if (readAt !== undefined && typeof readAt !== "string") {
    sendApiError(res, 400, "INVALID_READ_AT", "El campo 'leído en' no es válido");
    return;
  }

  if (timesRead !== undefined && typeof timesRead !== "string") {
    sendApiError(res, 400, "INVALID_TIMES_READ", "El campo 'veces leído' no es válido");
    return;
  }

  if (favoriteQuote !== undefined && typeof favoriteQuote !== "string") {
    sendApiError(res, 400, "INVALID_FAVORITE_QUOTE", "La cita favorita no es válida");
    return;
  }

  if (wouldRecommend !== undefined && !["si", "depende", "no"].includes(String(wouldRecommend))) {
    sendApiError(res, 400, "INVALID_WOULD_RECOMMEND", "La recomendación no es válida");
    return;
  }

  if (
    publicationYear !== undefined &&
    (typeof publicationYear !== "number" || publicationYear < 0 || publicationYear > 3000)
  ) {
    sendApiError(res, 400, "INVALID_PUBLICATION_YEAR", "El año de publicación no es válido");
    return;
  }

  if (pages !== undefined && (typeof pages !== "number" || pages < 1 || pages > 20000)) {
    sendApiError(res, 400, "INVALID_PAGES", "El número de páginas no es válido");
    return;
  }

  next();
};

export const validateUpdateBook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    sendApiError(res, 400, "INVALID_JSON_BODY", "El cuerpo debe ser un objeto JSON");
    return;
  }

  const keys = Object.keys(body as Record<string, unknown>);
  const unknown = keys.filter((k) => !updateBookKeys.includes(k as (typeof updateBookKeys)[number]));
  if (unknown.length > 0) {
    sendApiError(
      res,
      400,
      "UNKNOWN_BOOK_FIELDS",
      `Campos no permitidos: ${unknown.join(", ")}`,
      { fields: unknown }
    );
    return;
  }

  const allowedPresent = updateBookKeys.filter((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  );
  if (allowedPresent.length === 0) {
    sendApiError(res, 400, "EMPTY_BOOK_UPDATE", "Debes enviar al menos un campo para actualizar");
    return;
  }

  const { status, rating, progress, publicationYear, pages, currentPage, lastPageMarkedAt, publisher, reviewTags, synopsis, readAt, timesRead, favoriteQuote, wouldRecommend, isFavorite } = body as Record<string, unknown>;

  if (status !== undefined && !isValidStatus(status)) {
    sendApiError(res, 400, "INVALID_STATUS", "El estado no es válido");
    return;
  }

  if (rating !== undefined) {
    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      sendApiError(res, 400, "INVALID_RATING", "La calificación debe estar entre 0 y 5");
      return;
    }
  }

  if (progress !== undefined) {
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      sendApiError(res, 400, "INVALID_PROGRESS", "El progreso debe estar entre 0 y 100");
      return;
    }
  }

  if (publicationYear !== undefined) {
    if (
      typeof publicationYear !== "number" ||
      publicationYear < 0 ||
      publicationYear > 3000
    ) {
      sendApiError(res, 400, "INVALID_PUBLICATION_YEAR", "El año de publicación no es válido");
      return;
    }
  }

  if (pages !== undefined) {
    if (typeof pages !== "number" || pages < 1 || pages > 20000) {
      sendApiError(res, 400, "INVALID_PAGES", "El número de páginas no es válido");
      return;
    }
  }

  if (currentPage !== undefined) {
    if (typeof currentPage !== "number" || currentPage < 0 || currentPage > 20000) {
      sendApiError(res, 400, "INVALID_CURRENT_PAGE", "La página actual no es válida");
      return;
    }
  }

  if (lastPageMarkedAt !== undefined && Number.isNaN(new Date(String(lastPageMarkedAt)).getTime())) {
    sendApiError(res, 400, "INVALID_LAST_PAGE_MARKED_AT", "La fecha de marcado no es válida");
    return;
  }

  if (publisher !== undefined && (typeof publisher !== "string" || !publisher.trim())) {
    sendApiError(res, 400, "INVALID_PUBLISHER", "La editorial no es válida");
    return;
  }

  if (synopsis !== undefined && typeof synopsis !== "string") {
    sendApiError(res, 400, "INVALID_SYNOPSIS", "La sinopsis no es válida");
    return;
  }

  if (reviewTags !== undefined) {
    if (!Array.isArray(reviewTags) || reviewTags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 40)) {
      sendApiError(res, 400, "INVALID_REVIEW_TAGS", "Las etiquetas de reseña no son válidas");
      return;
    }
  }

  if (readAt !== undefined && typeof readAt !== "string") {
    sendApiError(res, 400, "INVALID_READ_AT", "El campo 'leído en' no es válido");
    return;
  }

  if (timesRead !== undefined && typeof timesRead !== "string") {
    sendApiError(res, 400, "INVALID_TIMES_READ", "El campo 'veces leído' no es válido");
    return;
  }

  if (favoriteQuote !== undefined && typeof favoriteQuote !== "string") {
    sendApiError(res, 400, "INVALID_FAVORITE_QUOTE", "La cita favorita no es válida");
    return;
  }

  if (wouldRecommend !== undefined && !["si", "depende", "no"].includes(String(wouldRecommend))) {
    sendApiError(res, 400, "INVALID_WOULD_RECOMMEND", "La recomendación no es válida");
    return;
  }

  if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
    sendApiError(res, 400, "INVALID_IS_FAVORITE", "El campo favorito no es válido");
    return;
  }

  next();
};
