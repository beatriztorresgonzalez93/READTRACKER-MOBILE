import { beforeEach, describe, expect, it, vi } from "vitest";
import { EngagementPushService } from "./engagementPushService";
import { sendExpoPushMessages } from "./expoPushService";

vi.mock("./expoPushService", () => ({
  sendExpoPushMessages: vi.fn(),
}));

vi.mock("../config/env", () => ({
  env: {
    pushEngagementEnabled: true,
    engagementInactiveDays: 3,
    engagementPushCooldownDays: 7,
  },
}));

const mockSend = sendExpoPushMessages as ReturnType<typeof vi.fn>;

describe("EngagementPushService", () => {
  const engagementRepo = {
    touchLastActive: vi.fn(),
    setPushEngagementEnabled: vi.fn(),
    getPushEngagementEnabled: vi.fn(),
    findInactivePushTargets: vi.fn(),
    markEngagementPushSent: vi.fn(),
  };
  const pushTokensRepo = {
    deleteByToken: vi.fn(),
  };

  const service = new EngagementPushService(
    engagementRepo as never,
    pushTokensRepo as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no envía si no hay usuarios inactivos", async () => {
    engagementRepo.findInactivePushTargets.mockResolvedValueOnce([]);
    const result = await service.runEngagementCampaign();
    expect(result.targeted).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("envía push y marca usuarios", async () => {
    engagementRepo.findInactivePushTargets.mockResolvedValueOnce([
      { userId: "u1", expoPushToken: "ExponentPushToken[abc]", inactiveDays: 4 },
    ]);
    mockSend.mockResolvedValueOnce({ sent: 1, failed: 0, invalidTokens: [] });

    const result = await service.runEngagementCampaign();

    expect(result.sent).toBe(1);
    expect(mockSend).toHaveBeenCalledWith([
      expect.objectContaining({
        to: "ExponentPushToken[abc]",
        title: expect.stringContaining("ReadTracker"),
      }),
    ]);
    expect(engagementRepo.markEngagementPushSent).toHaveBeenCalledWith(["u1"]);
  });
});
