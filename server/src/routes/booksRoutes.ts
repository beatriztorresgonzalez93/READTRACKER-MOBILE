// Define endpoints REST de libros y conecta middlewares/controlador.
import { Router } from "express";
import { BooksController } from "../controllers/booksController";
import { requireAuth } from "../middlewares/requireAuth";
import { validateCreateBook, validateUpdateBook } from "../middlewares/validateBookPayload";

export const createBooksRouter = (controller: BooksController) => {
  const router = Router();
  router.use(requireAuth);

  router.get("/", controller.getBooks);
  router.get("/summary", controller.getBooksSummary);
  router.get("/:id", controller.getBookById);
  router.post("/", validateCreateBook, controller.createBook);
  router.put("/:id", validateUpdateBook, controller.updateBook);
  router.delete("/:id", controller.deleteBook);

  return router;
};
