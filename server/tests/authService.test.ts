// Tests de actualización de perfil (firstName, lastName, name).
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "../src/services/authService";

describe("AuthService.updateProfile", () => {
  const findByIdMock = vi.fn();
  const updateProfileMock = vi.fn();
  const service = new AuthService({
    findById: findByIdMock,
    updateProfile: updateProfileMock,
  } as never);

  beforeEach(() => {
    vi.clearAllMocks();
    findByIdMock.mockResolvedValue({
      id: "user-1",
      firstName: "Ana",
      name: "Ana García",
      lastName: "García",
      email: "ana@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      trialEndsAt: null,
      isPro: false,
      proActivatedAt: null,
    });
    updateProfileMock.mockImplementation(async (_id, updates) => ({
      id: "user-1",
      email: "ana@test.com",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      trialEndsAt: null,
      isPro: false,
      proActivatedAt: null,
      ...updates,
    }));
  });

  it("stores firstName and rebuilds full name when only first and last are patched", async () => {
    await service.updateProfile("user-1", { firstName: "Beatriz", lastName: "Torres" });

    expect(updateProfileMock).toHaveBeenCalledWith("user-1", {
      firstName: "Beatriz",
      name: "Beatriz Torres",
      lastName: "Torres",
      avatarUrl: null,
    });
  });

  it("keeps explicit name when provided in patch", async () => {
    await service.updateProfile("user-1", {
      firstName: "Beatriz",
      lastName: "Torres",
      name: "Beatriz T.",
    });

    expect(updateProfileMock).toHaveBeenCalledWith("user-1", {
      firstName: "Beatriz",
      name: "Beatriz T.",
      lastName: "Torres",
      avatarUrl: null,
    });
  });
});
