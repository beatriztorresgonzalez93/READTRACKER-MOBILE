import { ApiError, SUBSCRIPTION_REQUIRED_CODE } from "@/shared/api/api-error";
import {
  API_NETWORK_ERROR_CODE,
  API_TIMEOUT_ERROR_CODE,
  formatApiError,
  formatApiErrorFromHttp,
  isNetworkFetchError,
} from "@/shared/lib/format-api-error";

describe("formatApiErrorFromHttp", () => {
  it("maps timeout and network codes", () => {
    expect(formatApiErrorFromHttp(0, API_TIMEOUT_ERROR_CODE)).toContain("tarda en responder");
    expect(formatApiErrorFromHttp(0, API_NETWORK_ERROR_CODE)).toContain("conexion");
  });

  it("maps render wake statuses", () => {
    expect(formatApiErrorFromHttp(503, "SERVICE_UNAVAILABLE")).toContain("despertando");
  });

  it("maps subscription required", () => {
    expect(formatApiErrorFromHttp(402, SUBSCRIPTION_REQUIRED_CODE)).toContain("Scriptorium Pro");
  });
});

describe("formatApiError", () => {
  it("returns ApiError message as-is", () => {
    const err = new ApiError("Mensaje del servidor", 400, "BAD_REQUEST");
    expect(formatApiError(err)).toBe("Mensaje del servidor");
  });

  it("detects network fetch failures", () => {
    expect(formatApiError(new TypeError("Network request failed"))).toContain("conexion");
    expect(isNetworkFetchError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("detects abort as timeout", () => {
    expect(formatApiError(new DOMException("Aborted", "AbortError"))).toContain("tarda en responder");
  });
});
