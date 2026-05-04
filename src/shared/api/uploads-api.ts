// Cliente del endpoint de URLs firmadas para subir portadas a S3.
import { apiRequest } from "@/shared/api/client";

export type CoverPresignPayload = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
  expiresIn: number;
};

export async function requestCoverPresignedUpload(
  token: string,
  contentType: string,
): Promise<CoverPresignPayload> {
  const response = await apiRequest<{ data?: CoverPresignPayload }>("/uploads/cover", {
    method: "POST",
    token,
    body: { contentType },
  });
  if (!response.data) {
    throw new Error("Respuesta inválida del servidor");
  }
  return response.data;
}

export async function requestAvatarPresignedUpload(
  token: string,
  contentType: string,
): Promise<CoverPresignPayload> {
  const response = await apiRequest<{ data?: CoverPresignPayload }>("/uploads/avatar", {
    method: "POST",
    token,
    body: { contentType },
  });
  if (!response.data) {
    throw new Error("Respuesta inválida del servidor");
  }
  return response.data;
}
