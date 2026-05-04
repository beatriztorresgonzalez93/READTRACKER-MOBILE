// Subida de foto de perfil a S3 (misma cuenta IAM que portadas: prefijo users/{id}/avatars/).
// En web, si el servidor aún no expone POST /uploads/avatar (404) o S3 no está configurado (503),
// se usa JPEG en base64 admitido por PATCH /auth/me (límite de tamaño en el backend).
import { Platform } from "react-native";

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

const MAX_AVATAR_DATA_URL_CHARS = 190_000;

function presignFailureAllowsWebFallback(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /\b404\b|Request failed with status 404|\b503\b|Request failed with status 503|S3_UPLOADS_DISABLED|NOT_FOUND|Ruta no encontrada/i.test(
      msg,
    )
  );
}

/** Solo web: comprime a JPEG y devuelve data URL por debajo del límite del PATCH de perfil. */
async function localAvatarUriToJpegDataUrl(localUri: string): Promise<string> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    throw new Error(
      "No se pudo subir la foto (servidor sin endpoint de subida). Despliega la última versión de la API o configura S3.",
    );
  }

  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = objectUrl;
    });

    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      throw new Error("Imagen no válida.");
    }

    const shrink = (maxSide: number) => {
      const scale = Math.min(1, maxSide / Math.max(w, h));
      return {
        w: Math.max(1, Math.round(w * scale)),
        h: Math.max(1, Math.round(h * scale)),
      };
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo procesar la imagen.");
    }

    const maxSides = [512, 400, 320, 256, 220, 192];
    for (const maxSide of maxSides) {
      const { w: cw, h: ch } = shrink(maxSide);
      canvas.width = cw;
      canvas.height = ch;
      for (let q = 0.9; q >= 0.45; q -= 0.06) {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL("image/jpeg", q);
        if (dataUrl.length <= MAX_AVATAR_DATA_URL_CHARS) {
          return dataUrl;
        }
      }
    }

    throw new Error(
      "La imagen es demasiado grande incluso comprimida. Prueba con otra foto o una resolución menor.",
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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

  try {
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
  } catch (err) {
    if (Platform.OS === "web" && presignFailureAllowsWebFallback(err)) {
      return localAvatarUriToJpegDataUrl(localUri);
    }
    throw err;
  }
}
