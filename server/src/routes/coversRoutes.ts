// Rutas REST de portadas (búsqueda externa).
import { Router } from "express";
import { CoversController } from "../controllers/coversController";

export const createCoversRouter = (controller: CoversController) => {
  const router = Router();

  router.get("/search", controller.searchCovers);

  return router;
};
