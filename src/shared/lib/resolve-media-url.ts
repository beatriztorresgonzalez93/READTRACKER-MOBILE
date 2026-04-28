import { env } from "@/shared/config/env";

/**
 * Turn API cover paths into a full URL when the backend returns relative paths.
 */
export function resolveBookCoverUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  try {
    const base = new URL(env.apiBaseUrl);
    if (trimmed.startsWith("/")) return `${base.origin}${trimmed}`;
    return `${base.origin}/${trimmed}`;
  } catch {
    return trimmed;
  }
}
