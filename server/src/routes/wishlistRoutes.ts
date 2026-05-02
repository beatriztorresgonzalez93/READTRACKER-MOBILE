// Rutas REST de lista de deseos (por usuario autenticado).
import { Router } from "express";
import type { RequestHandler } from "express";
import { WishlistController } from "../controllers/wishlistController";
import { validateCreateWishlistItem } from "../middlewares/validateWishlistPayload";

export const createWishlistRouter = (controller: WishlistController, requireAuth: RequestHandler) => {
  const router = Router();
  router.use(requireAuth);

  router.get("/", controller.list);
  router.get("/acquisitions", controller.listAcquisitions);
  router.post("/", validateCreateWishlistItem, controller.create);
  router.put("/:id", validateCreateWishlistItem, controller.update);
  router.post("/:id/purchase", controller.purchase);
  router.delete("/:id", controller.remove);

  return router;
};
