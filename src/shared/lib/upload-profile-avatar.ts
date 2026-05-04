// Subida de foto de perfil a S3 (misma cuenta IAM que portadas: prefijo users/{id}/avatars/).
import { requestAvatarPresignedUpload } from "@/shared/api/uploads-api";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function guessMimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function normalizeMime(raw: string | null | undefined, uri: string): string {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (trimmed && MIME_TO_EXT[trimmed]) return trimmed;
  return guessMimeFromUri(uri);
}

/** URL ya válida para el backend (http(s) o data URL admitida en PATCH /auth/me). */
export function avatarUrlIsPersistable(url: string | null): boolean {
  if (!url?.trim()) return false;
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return true;
  return (
    t.startsWith("data:image/jpeg;base64,") ||
    t.startsWith("data:image/png;base64,") ||
    t.startsWith("data:image/webp;base64,")
  );
}

/** URI local del picker (file:, content:, ph:, blob:) → hay que subir a S3 antes de PATCH. */
export function avatarUriNeedsS3Upload(url: string | null): url is string {
  if (!url?.trim()) return false;
  return !avatarUrlIsPersistable(url);
}

export async function uploadLocalAvatarUriToS3(
  token: string,
  localUri: string,
  mimeHint?: string | null,
): Promise<string> {
  const mime = normalizeMime(mimeHint, localUri);
  if (!MIME_TO_EXT[mime]) {
    throw new Error("Formato no admitido. Usa JPG, PNG, WebP o GIF.");
  }

  const { uploadUrl, publicUrl, contentType } = await requestAvatarPresignedUpload(token, mime);

  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error(`Error al subir la foto (${putRes.status})`);
  }

  return publicUrl;
}
