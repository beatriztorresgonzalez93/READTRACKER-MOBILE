import { apiRequest } from "@/shared/api/client";
import { ApiError, SUBSCRIPTION_REQUIRED_CODE } from "@/shared/api/api-error";
import { setSubscriptionRequiredHandler } from "@/shared/api/subscription-required";

describe("apiRequest", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    setSubscriptionRequiredHandler(null);
  });

  it("notifies handler and throws ApiError on 402 SUBSCRIPTION_REQUIRED", async () => {
    const handler = jest.fn();
    setSubscriptionRequiredHandler(handler);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () =>
        JSON.stringify({
          code: SUBSCRIPTION_REQUIRED_CODE,
          message: "Activa Scriptorium Pro para acceder a esta funcion.",
        }),
    }) as typeof fetch;

    let thrown: unknown;
    try {
      await apiRequest("/books");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({
      status: 402,
      code: SUBSCRIPTION_REQUIRED_CODE,
      message: "Activa Scriptorium Pro para acceder a esta funcion.",
    });
    expect(handler).toHaveBeenCalledWith("Activa Scriptorium Pro para acceder a esta funcion.");
  });

  it("throws ApiError without handler on other error statuses", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ code: "SERVER_ERROR", message: "Fallo interno" }),
    }) as typeof fetch;

    await expect(apiRequest("/books")).rejects.toMatchObject({
      status: 500,
      code: "SERVER_ERROR",
      message: "Fallo interno",
    });
  });

  it("maps 503 to a friendly waking-up message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ code: "SERVICE_UNAVAILABLE", message: "Service Unavailable" }),
    }) as typeof fetch;

    await expect(apiRequest("/books")).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("despertando"),
    });
  });

  it("maps network failures to a friendly offline message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as typeof fetch;

    await expect(apiRequest("/books")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
      message: expect.stringContaining("conexion"),
    });
  });

  it("maps request timeout to a friendly message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")) as typeof fetch;

    await expect(apiRequest("/books")).rejects.toMatchObject({
      status: 0,
      code: "TIMEOUT",
      message: expect.stringContaining("tarda en responder"),
    });
  });
});
