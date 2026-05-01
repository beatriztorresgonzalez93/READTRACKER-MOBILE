// HTTP para lista de deseos por usuario autenticado.
import { Request, Response } from "express";
import { logError } from "../logger";
import { WishlistService } from "../services/wishlistService";
import { sendApiError } from "../utils/apiResponse";

export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  private getSingleParamValue(value: unknown): string | null {
    return typeof value === "string" ? value : null;
  }

  list = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const items = await this.service.list(userId);
      res.status(200).json({ data: items });
    } catch (err) {
      logError("WishlistController.list", err);
      sendApiError(res, 500, "WISHLIST_LIST_FAILED", "No se pudo cargar la lista de deseos");
    }
  };

  listAcquisitions = async (_req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const items = await this.service.listAcquisitions(userId);
      res.status(200).json({ data: items });
    } catch (err) {
      logError("WishlistController.listAcquisitions", err);
      sendApiError(res, 500, "WISHLIST_ACQUISITIONS_LIST_FAILED", "No se pudieron cargar las adquisiciones");
    }
  };

  create = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    try {
      const item = await this.service.create(userId, req.body);
      res.status(201).json({ data: item });
    } catch (err) {
      logError("WishlistController.create", err);
      sendApiError(res, 500, "WISHLIST_CREATE_FAILED", "No se pudo guardar el deseo");
    }
  };

  update = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_WISHLIST_ID", "El id no es válido");
      return;
    }
    try {
      const item = await this.service.update(userId, id, req.body);
      if (!item) {
        sendApiError(res, 404, "WISHLIST_ITEM_NOT_FOUND", "Deseo no encontrado");
        return;
      }
      res.status(200).json({ data: item });
    } catch (err) {
      logError("WishlistController.update", err);
      sendApiError(res, 500, "WISHLIST_UPDATE_FAILED", "No se pudo actualizar el deseo");
    }
  };

  remove = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_WISHLIST_ID", "El id no es válido");
      return;
    }
    try {
      const removed = await this.service.remove(userId, id);
      if (!removed) {
        sendApiError(res, 404, "WISHLIST_ITEM_NOT_FOUND", "Deseo no encontrado");
        return;
      }
      res.status(200).json({ data: { id } });
    } catch (err) {
      logError("WishlistController.remove", err);
      sendApiError(res, 500, "WISHLIST_DELETE_FAILED", "No se pudo eliminar el deseo");
    }
  };

  purchase = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }
    const id = this.getSingleParamValue(req.params.id);
    if (!id) {
      sendApiError(res, 400, "INVALID_WISHLIST_ID", "El id no es válido");
      return;
    }
    try {
      const acquired = await this.service.purchase(userId, id);
      if (!acquired) {
        sendApiError(res, 404, "WISHLIST_ITEM_NOT_FOUND", "Deseo no encontrado");
        return;
      }
      res.status(200).json({ data: acquired });
    } catch (err) {
      logError("WishlistController.purchase", err);
      sendApiError(res, 500, "WISHLIST_PURCHASE_FAILED", "No se pudo completar la compra");
    }
  };
}
