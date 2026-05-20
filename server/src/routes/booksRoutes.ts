// Define endpoints REST de libros y conecta middlewares/controlador.
import { Router } from "express";
import type { RequestHandler } from "express";
import { BookMetadataController } from "../controllers/bookMetadataController";
import { BooksController } from "../controllers/booksController";
import { validateCreateBook, validateUpdateBook } from "../middlewares/validateBookPayload";

export const createBooksRouter = (
  controller: BooksController,
  metadataController: BookMetadataController,
  requireAuth: RequestHandler,
) => {
  const router = Router();
  router.use(requireAuth);

  router.post("/metadata/enrich", metadataController.enrich);
  router.post("/metadata/discover-isbn", metadataController.discoverFromIsbn);

  router.get("/", controller.getBooks);
  router.get("/summary", controller.getBooksSummary);
  router.get("/:id", controller.getBookById);
  router.post("/", validateCreateBook, controller.createBook);
  router.put("/:id", validateUpdateBook, controller.updateBook);
  router.delete("/:id", controller.deleteBook);

  return router;
};
