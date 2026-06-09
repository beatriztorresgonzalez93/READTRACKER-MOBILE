import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequireProOrTrial } from "../src/middlewares/requireProOrTrial";
import type { BillingService } from "../src/services/billingService";

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("createRequireProOrTrial", () => {
  const billingService = {
    hasAppAccess: vi.fn(),
  } as unknown as BillingService;

  const middleware = createRequireProOrTrial(billingService);
  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when userId is missing", async () => {
    const res = mockRes();
    (res as Response).locals = {};
    await middleware({} as Request, res, next);
    expect(res.statusCode).toBe(401);
    expect((res.body as { code: string }).code).toBe("AUTH_REQUIRED");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 402 when user has no Pro nor active trial", async () => {
    vi.mocked(billingService.hasAppAccess).mockResolvedValueOnce(false);
    const res = mockRes();
    (res as Response).locals = { userId: "user-1" };
    await middleware({} as Request, res, next);
    expect(res.statusCode).toBe(402);
    expect((res.body as { code: string }).code).toBe("SUBSCRIPTION_REQUIRED");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when user has app access", async () => {
    vi.mocked(billingService.hasAppAccess).mockResolvedValueOnce(true);
    const res = mockRes();
    (res as Response).locals = { userId: "user-1" };
    await middleware({} as Request, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
