// Prepara la foto de perfil para guardarla en Firestore (data URL comprimida, sin Storage ni API).
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

import { requestAvatarPresignedUpload } from "@/shared/api/uploads-api";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Firestore permite ~1 MiB por documento. Tras comprimir (~256–400 px JPEG)
 * solemos quedar en 30–120 KiB; este tope evita desbordar el documento entero.
 */
export const MAX_AVATAR_DATA_URL_CHARS = 280_000;

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

function dataUrlFromBase64(base64: string): string {
  const clean = base64.replace(/\s/g, "");
  return `data:image/jpeg;base64,${clean}`;
}

/** URL lista para el campo `avatarUrl` en Firestore (https o data URL). */
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

/** URI local del picker → hay que convertir antes de guardar. */
export function avatarUriNeedsPrepare(url: string | null): url is string {
  if (!url?.trim()) return false;
  return !avatarUrlIsPersistable(url);
}

/** @deprecated Usar `avatarUriNeedsPrepare`. */
export const avatarUriNeedsS3Upload = avatarUriNeedsPrepare;

async function compressUriToJpegDataUrlNative(uri: string): Promise<string> {
  const widths = [480, 400, 320, 256, 200];
  const compressSteps = [0.82, 0.7, 0.58, 0.48, 0.38];

  for (const width of widths) {
    for (const compress of compressSteps) {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        {
          compress,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!result.base64) continue;
      const dataUrl = dataUrlFromBase64(result.base64);
      if (dataUrl.length <= MAX_AVATAR_DATA_URL_CHARS) {
        return dataUrl;
      }
    }
  }

  throw new Error(
    "No pudimos comprimir la foto lo suficiente. Prueba con otra imagen o recorta más en el selector.",
  );
}

async function localAvatarUriToJpegDataUrlWeb(localUri: string): Promise<string> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    throw new Error("No se pudo procesar la imagen en este dispositivo.");
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

    const maxSides = [480, 400, 320, 256, 200];
    for (const maxSide of maxSides) {
      const { w: cw, h: ch } = shrink(maxSide);
      canvas.width = cw;
      canvas.height = ch;
      for (let q = 0.85; q >= 0.35; q -= 0.08) {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL("image/jpeg", q);
        if (dataUrl.length <= MAX_AVATAR_DATA_URL_CHARS) {
          return dataUrl;
        }
      }
    }

    throw new Error(
      "No pudimos comprimir la foto lo suficiente. Prueba con otra imagen.",
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Comprime la imagen elegida en la galería y devuelve una data URL para Firestore.
 * Llamar justo después del ImagePicker (con `uri` del asset).
 */
export async function compressAvatarPickerAsset(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    return localAvatarUriToJpegDataUrlWeb(uri);
  }
  return compressUriToJpegDataUrlNative(uri);
}

/** @deprecated Usar `compressAvatarPickerAsset`. */
export function avatarDataUrlFromPickerBase64(
  base64: string,
  _mimeHint?: string | null,
): string {
  const dataUrl = dataUrlFromBase64(base64);
  if (dataUrl.length > MAX_AVATAR_DATA_URL_CHARS) {
    throw new Error(
      "La imagen es demasiado grande. Se comprimirá al guardar; si persiste, elige otra foto.",
    );
  }
  return dataUrl;
}

async function localAvatarUriToDataUrl(localUri: string): Promise<string> {
  return compressAvatarPickerAsset(localUri);
}

function apiUploadOptional(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return !/\b404\b|NOT_FOUND|Ruta no encontrada|S3_UPLOADS_DISABLED/i.test(msg);
}

async function tryUploadViaApiS3(
  token: string,
  localUri: string,
  mimeHint?: string | null,
): Promise<string | null> {
  const mime = normalizeMime(mimeHint, localUri);
  if (!MIME_TO_EXT[mime]) return null;

  try {
    const { uploadUrl, publicUrl, contentType } = await requestAvatarPresignedUpload(token, mime);
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!putRes.ok) return null;
    return publicUrl;
  } catch (error) {
    if (apiUploadOptional(error)) throw error;
    return null;
  }
}

/**
 * Devuelve una URL persistible en Firestore (data URL JPEG comprimida o https).
 */
export async function prepareAvatarUrlForFirestore(
  token: string,
  localUri: string,
  mimeHint?: string | null,
): Promise<string> {
  if (avatarUrlIsPersistable(localUri)) {
    const trimmed = localUri.trim();
    if (trimmed.length <= MAX_AVATAR_DATA_URL_CHARS) {
      return trimmed;
    }
    if (trimmed.startsWith("data:") && Platform.OS === "web") {
      return localAvatarUriToJpegDataUrlWeb(trimmed);
    }
    if (trimmed.startsWith("file:") || trimmed.startsWith("content:") || trimmed.startsWith("ph:")) {
      return compressAvatarPickerAsset(trimmed);
    }
    throw new Error(
      "La foto guardada es demasiado grande. Pulsa «Cambiar foto» y elige la imagen de nuevo.",
    );
  }

  const httpsUrl = await tryUploadViaApiS3(token, localUri, mimeHint);
  if (httpsUrl) return httpsUrl;

  return compressAvatarPickerAsset(localUri);
}

/** @deprecated Usar `prepareAvatarUrlForFirestore`. */
export const uploadLocalAvatarUriToS3 = prepareAvatarUrlForFirestore;
