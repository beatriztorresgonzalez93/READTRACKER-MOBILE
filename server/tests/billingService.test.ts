import { describe, expect, it, vi } from "vitest";
import { BillingService } from "../src/services/billingService";
import type { UsersRepository } from "../src/repositories/usersRepository";

describe("BillingService.hasAppAccess", () => {
  const usersRepository = {
    findById: vi.fn(),
  } as unknown as UsersRepository;

  const service = new BillingService(usersRepository);

  it("returns true when user is Pro", async () => {
    vi.mocked(usersRepository.findById).mockResolvedValueOnce({
      id: "u1",
      name: "Ana",
      lastName: "",
      email: "a@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      trialEndsAt: null,
      isPro: true,
      proActivatedAt: "2026-02-01T00:00:00.000Z",
    });
    await expect(service.hasAppAccess("u1")).resolves.toBe(true);
  });

  it("returns true when trial is still active", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    vi.mocked(usersRepository.findById).mockResolvedValueOnce({
      id: "u1",
      name: "Ana",
      lastName: "",
      email: "a@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      trialEndsAt: future,
      isPro: false,
      proActivatedAt: null,
    });
    await expect(service.hasAppAccess("u1")).resolves.toBe(true);
  });

  it("returns false when trial expired and not Pro", async () => {
    vi.mocked(usersRepository.findById).mockResolvedValueOnce({
      id: "u1",
      name: "Ana",
      lastName: "",
      email: "a@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      trialEndsAt: "2020-01-01T00:00:00.000Z",
      isPro: false,
      proActivatedAt: null,
    });
    await expect(service.hasAppAccess("u1")).resolves.toBe(false);
  });
});

describe("BillingService.isTrialActive", () => {
  it("returns false for null or past dates", () => {
    expect(BillingService.isTrialActive(null)).toBe(false);
    expect(BillingService.isTrialActive("2020-01-01T00:00:00.000Z")).toBe(false);
  });

  it("returns true for future trial end", () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    expect(BillingService.isTrialActive(future)).toBe(true);
  });
});
