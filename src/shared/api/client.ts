// Utilidad HTTP base para llamadas autenticadas a la API.
import { env } from "@/shared/config/env";
import {
  API_NETWORK_ERROR_CODE,
  API_TIMEOUT_ERROR_CODE,
  formatApiErrorFromHttp,
  isNetworkFetchError,
} from "@/shared/lib/format-api-error";

import { ApiError, SUBSCRIPTION_REQUIRED_CODE } from "@/shared/api/api-error";
import { notifySubscriptionRequired } from "@/shared/api/subscription-required";

/** Render free tier puede tardar ~30–60 s en cold start. */
export const API_REQUEST_TIMEOUT_MS = 45_000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

type ApiErrorBody = {
  code?: string;
  message?: string;
  error?: string;
};

function normalizePath(path: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${env.apiBaseUrl}${path}`;
  return `${env.apiBaseUrl}/${path}`;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

function toRequestFailureError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAbortError(error)) {
    const message = formatApiErrorFromHttp(0, API_TIMEOUT_ERROR_CODE);
    return new ApiError(message, 0, API_TIMEOUT_ERROR_CODE);
  }

  if (isNetworkFetchError(error)) {
    const message = formatApiErrorFromHttp(0, API_NETWORK_ERROR_CODE);
    return new ApiError(message, 0, API_NETWORK_ERROR_CODE);
  }

  const fallback = formatApiErrorFromHttp(0, API_NETWORK_ERROR_CODE);
  return new ApiError(fallback, 0, API_NETWORK_ERROR_CODE);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(normalizePath(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw toRequestFailureError(error);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const raw = await response.text();
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = raw.trim() ? (JSON.parse(raw) as ApiErrorBody) : null;
    } catch {
      /* cuerpo no JSON */
    }
    const code = typeof parsed?.code === "string" ? parsed.code : "";
    const serverMessage = parsed?.message ?? parsed?.error ?? (raw.trim() ? raw.slice(0, 500) : fallback);
    const message = formatApiErrorFromHttp(response.status, code, serverMessage);

    if (response.status === 402 && code === SUBSCRIPTION_REQUIRED_CODE) {
      notifySubscriptionRequired(message);
    }

    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
