import { EngagementPushRepository } from "../repositories/engagementPushRepository";
import { PushTokensRepository } from "../repositories/pushTokensRepository";
import { EngagementPushService } from "./engagementPushService";

export class NotificationsService {
  private readonly engagement: EngagementPushService;

  constructor(
    private readonly pushTokensRepo: PushTokensRepository,
    private readonly engagementRepo: EngagementPushRepository,
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

  async simulateInactivityForUser(
    userId: string,
    options: { inactiveDays: number; clearCooldown: boolean },
  ): Promise<{ userId: string; pushTokenCount: number; inactiveDays: number }> {
    await this.engagementRepo.setLastActiveDaysAgo(userId, options.inactiveDays);
    if (options.clearCooldown) {
      await this.engagementRepo.clearLastEngagementPush(userId);
    }
    const pushTokenCount = await this.engagementRepo.countPushTokensForUser(userId);
    return { userId, pushTokenCount, inactiveDays: options.inactiveDays };
  }

  async simulateInactivityByEmail(
    email: string,
    options: { inactiveDays: number; clearCooldown: boolean },
  ): Promise<{ userId: string; pushTokenCount: number; inactiveDays: number }> {
    const userId = await this.engagementRepo.findUserIdByEmail(email);
    if (!userId) {
      throw new Error(`No hay usuario con email: ${email}`);
    }
    return this.simulateInactivityForUser(userId, options);
  }
}
