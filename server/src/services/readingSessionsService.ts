import { ReadingSessionsRepository } from "../repositories/readingSessionsRepository";
import { EngagementPushRepository } from "../repositories/engagementPushRepository";
// Lógica de negocio para consultar, crear y borrar sesiones de lectura.
import { CreateReadingSessionDto } from "../types/readingSession";

export class ReadingSessionsService {
  constructor(
    private readonly repository: ReadingSessionsRepository,
    private readonly engagementPushRepository: EngagementPushRepository,
  ) {}

  async getSessions(userId: string) {
    return this.repository.findAllByUserId(userId);
  }

  async createSession(userId: string, data: CreateReadingSessionDto) {
    const session = await this.repository.create(userId, data);
    if (session) {
      await this.engagementPushRepository.touchLastActive(userId);
    }
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    return this.repository.deleteById(userId, sessionId);
  }
}
