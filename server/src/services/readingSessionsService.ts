import { ReadingSessionsRepository } from "../repositories/readingSessionsRepository";
// Lógica de negocio para consultar, crear y borrar sesiones de lectura.
import { CreateReadingSessionDto } from "../types/readingSession";

export class ReadingSessionsService {
  constructor(private readonly repository: ReadingSessionsRepository) {}

  async getSessions(userId: string) {
    return this.repository.findAllByUserId(userId);
  }

  async createSession(userId: string, data: CreateReadingSessionDto) {
    return this.repository.create(userId, data);
  }

  async deleteSession(userId: string, sessionId: string) {
    return this.repository.deleteById(userId, sessionId);
  }
}
