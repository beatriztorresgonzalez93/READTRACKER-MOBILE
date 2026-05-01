// Validación del cuerpo al crear un ítem de lista de deseos.
import { NextFunction, Request, Response } from "express";
import { WishlistPriority } from "../types/wishlist";
import { sendApiError } from "../utils/apiResponse";

const validPriorities = new Set<WishlistPriority>([1, 2, 3, 4, 5]);

export const validateCreateWishlistItem = (req: Request, res: Response, next: NextFunction) => {
  const { title, author, price, store, priority } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    sendApiError(res, 400, "INVALID_TITLE", "El título es obligatorio");
    return;
  }
  if (!author || typeof author !== "string" || !author.trim()) {
    sendApiError(res, 400, "INVALID_AUTHOR", "El autor es obligatorio");
    return;
  }
  if (price !== undefined && price !== null && typeof price !== "string") {
    sendApiError(res, 400, "INVALID_PRICE", "El precio no es válido");
    return;
  }
  if (store !== undefined && store !== null && typeof store !== "string") {
    sendApiError(res, 400, "INVALID_STORE", "La tienda no es válida");
    return;
  }
  if (priority !== undefined && priority !== null) {
    if (typeof priority !== "number" || !Number.isInteger(priority) || !validPriorities.has(priority as WishlistPriority)) {
      sendApiError(res, 400, "INVALID_PRIORITY", "La prioridad debe ser un entero entre 1 y 5");
      return;
    }
  }

  next();
};
