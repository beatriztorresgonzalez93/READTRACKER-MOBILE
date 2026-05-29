import { env } from "../config/env";
import { EngagementPushRepository } from "../repositories/engagementPushRepository";
import { PushTokensRepository } from "../repositories/pushTokensRepository";
import { logInfo } from "../logger";
import { sendExpoPushMessages, type ExpoPushMessage } from "./expoPushService";

function buildEngagementCopy(inactiveDays: number): { title: string; body: string } {
  const daysLabel = inactiveDays === 1 ? "1 día" : `${inactiveDays} días`;
  return {
    title: "Te echamos de menos en ReadTracker",
    body: `Hace ${daysLabel} que no abres la app. Tu biblioteca te espera: marca una página o retoma un libro.`,
  };
}

export class EngagementPushService {
  constructor(
    private readonly engagementRepo: EngagementPushRepository,
    private readonly pushTokensRepo: PushTokensRepository,
  ) {}

  async touchActivity(userId: string): Promise<void> {
    await this.engagementRepo.touchLastActive(userId);
  }

  async setEngagementEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.engagementRepo.setPushEngagementEnabled(userId, enabled);
  }

  async getEngagementEnabled(userId: string): Promise<boolean> {
    return this.engagementRepo.getPushEngagementEnabled(userId);
  }

  /** Campaña de re-engagement: usuarios inactivos que aceptaron avisos. */
  async runEngagementCampaign(): Promise<{
    targeted: number;
    sent: number;
    failed: number;
    removedTokens: number;
  }> {
    if (!env.pushEngagementEnabled) {
      return { targeted: 0, sent: 0, failed: 0, removedTokens: 0 };
    }

    const targets = await this.engagementRepo.findInactivePushTargets(
      env.engagementInactiveDays,
      env.engagementPushCooldownDays,
    );

    if (targets.length === 0) {
      logInfo("engagementPush.noTargets", {});
      return { targeted: 0, sent: 0, failed: 0, removedTokens: 0 };
    }

    const messages: ExpoPushMessage[] = targets.map((target) => {
      const copy = buildEngagementCopy(target.inactiveDays);
      return {
        to: target.expoPushToken,
        title: copy.title,
        body: copy.body,
        sound: "default",
        data: { type: "engagement", inactiveDays: String(target.inactiveDays) },
      };
    });

    const { sent, failed, invalidTokens } = await sendExpoPushMessages(messages);

    const userIds = [...new Set(targets.map((t) => t.userId))];
    await this.engagementRepo.markEngagementPushSent(userIds);

    for (const token of invalidTokens) {
      await this.pushTokensRepo.deleteByToken(token);
    }

    logInfo("engagementPush.complete", {
      targeted: targets.length,
      sent,
      failed,
      removedTokens: invalidTokens.length,
    });

    return {
      targeted: targets.length,
      sent,
      failed,
      removedTokens: invalidTokens.length,
    };
  }
}
