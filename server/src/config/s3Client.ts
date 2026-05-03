// Cliente S3 singleton para URLs firmadas (credenciales IAM por entorno).
import { S3Client } from "@aws-sdk/client-s3";

import { env, isS3UploadsConfigured } from "./env";

let client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (!isS3UploadsConfigured()) return null;
  if (!client) {
    client = new S3Client({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey
      }
    });
  }
  return client;
}
