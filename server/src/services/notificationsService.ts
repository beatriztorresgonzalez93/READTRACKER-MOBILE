import { EngagementPushRepository } from "../repositories/engagementPushRepository";
import { PushTokensRepository } from "../repositories/pushTokensRepository";
import { EngagementPushService } from "./engagementPushService";

export class NotificationsService {
  private readonly engagement: EngagementPushService;

  constructor(
    private readonly pushTokensRepo: PushTokensRepository,
    engagementRepo: EngagementPushRepository,
  ) {
    this.engagement = new EngagementPushService(engagementRepo, pushTokensRepo);
  }

  async registerPushToken(userId: string, expoPushToken: string, platform: string): Promise<void> {
    await this.pushTokensRepo.upsert(userId, expoPushToken, platform);
    await this.engagement.touchActivity(userId);
  }

  async unregisterPushToken(expoPushToken: string): Promise<void> {
    await this.pushTokensRepo.deleteByToken(expoPushToken);
  }

  async recordActivity(userId: string): Promise<void> {
    await this.engagement.touchActivity(userId);
  }

  async getEngagementEnabled(userId: string): Promise<boolean> {
    return this.engagement.getEngagementEnabled(userId);
  }

  async setEngagementEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.engagement.setEngagementEnabled(userId, enabled);
  }

  runEngagementCampaign() {
    return this.engagement.runEngagementCampaign();
  }
}
