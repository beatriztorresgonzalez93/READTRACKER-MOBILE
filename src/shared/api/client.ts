// Utilidad HTTP base para llamadas autenticadas a la API.
import { env } from "@/shared/config/env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

type ApiErrorBody = {
  error?: string;
  message?: string;
};

function normalizePath(path: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${env.apiBaseUrl}${path}`;
  return `${env.apiBaseUrl}/${path}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const response = await fetch(normalizePath(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const raw = await response.text();
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = raw.trim() ? (JSON.parse(raw) as ApiErrorBody) : null;
    } catch {
      /* cuerpo no JSON */
    }
    const message = parsed?.message ?? parsed?.error ?? (raw.trim() ? raw.slice(0, 500) : fallback);
    throw new Error(message || fallback);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

