// Selección de imagen y subida directa a S3 con URL firmada (backend valida Firebase).
import * as ImagePicker from "expo-image-picker";

import { requestCoverPresignedUpload } from "@/shared/api/uploads-api";

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

/**
 * Pide permiso, abre la galería, obtiene presign con el token Firebase y hace PUT a S3.
 * @returns URL pública del objeto para guardarla en `coverUrl`.
 */
export async function pickImageAndUploadBookCover(token: string): Promise<string> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Se necesita permiso para acceder a las fotos.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    throw new Error("Selección cancelada");
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const mime = normalizeMime(asset.mimeType ?? null, uri);

  if (!MIME_TO_EXT[mime]) {
    throw new Error("Formato no admitido. Usa JPG, PNG, WebP o GIF.");
  }

  const { uploadUrl, publicUrl, contentType } = await requestCoverPresignedUpload(token, mime);

  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error(`Error al subir la imagen (${putRes.status})`);
  }

  return publicUrl;
}
