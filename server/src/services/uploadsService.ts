// URLs firmadas PutObject en S3 tras validar Firebase (usuario en capa HTTP).
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { env } from "../config/env";
import { getS3Client } from "../config/s3Client";

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

const PRESIGN_EXPIRES_SECONDS = 300;

export class UploadsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadsConfigError";
  }
}

export type CoverPresignResult = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
  expiresIn: number;
};

function buildPublicUrl(bucket: string, region: string, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

export class UploadsService {
  async createCoverPresignedPut(userId: string, contentTypeRaw: string): Promise<CoverPresignResult> {
    const contentType = contentTypeRaw.trim().toLowerCase();
    const ext = ALLOWED_TYPES.get(contentType);
    if (!ext) {
      throw new Error("Tipo de imagen no permitido. Usa image/jpeg, image/png, image/webp o image/gif.");
    }

    const client = getS3Client();
    if (!client) {
      throw new UploadsConfigError("S3 no está configurado en el servidor");
    }

    const bucket = env.s3Bucket;
    const region = env.awsRegion;
    const key = `users/${userId}/covers/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS
    });

    const publicUrl = buildPublicUrl(bucket, region, key);

    return {
      uploadUrl,
      publicUrl,
      key,
      contentType,
      expiresIn: PRESIGN_EXPIRES_SECONDS
    };
  }
}
