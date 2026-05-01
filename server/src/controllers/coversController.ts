// Capa HTTP: búsqueda de portadas por título.
import { Request, Response } from "express";
import { logError } from "../logger";
import { CoversSearchError, CoversService } from "../services/coversService";

export class CoversController {
  constructor(private readonly service: CoversService) {}

  searchCovers = async (req: Request, res: Response) => {
    const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
    const author =
      typeof req.query.author === "string" && req.query.author.trim() ? req.query.author.trim() : undefined;
    if (!title) {
      res.status(400).json({ error: "El parámetro title es obligatorio" });
      return;
    }

    try {
      const covers = await this.service.searchByTitle(title, author);
      res.status(200).json({ data: covers });
    } catch (err) {
      logError("CoversController.searchCovers", err);
      if (err instanceof CoversSearchError) {
        res.status(502).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: "No se pudo buscar portadas en este momento" });
    }
  };
}
