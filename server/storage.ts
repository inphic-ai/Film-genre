// Cloudflare R2 storage helpers using AWS S3 SDK
// R2 is S3-compatible, so we use @aws-sdk/client-s3

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

type R2Config = {
  client: S3Client;
  bucketName: string;
  publicUrl: string;
};

function getR2Config(): R2Config {
  const { r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2BucketName, r2Endpoint, r2PublicUrl } = ENV;

  if (!r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error(
      "R2 credentials missing: set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
    );
  }

  const client = new S3Client({
    region: "auto", // R2 uses 'auto' as region
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  return {
    client,
    bucketName: r2BucketName,
    publicUrl: r2PublicUrl || r2Endpoint,
  };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload file to Cloudflare R2
 * @param relKey - Relative key (path) for the file in R2
 * @param data - File data (Buffer, Uint8Array, or string)
 * @param contentType - MIME type of the file
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { client, bucketName, publicUrl } = getR2Config();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
  });

  try {
    await client.send(command);
    
    // Construct public URL
    // If R2_PUBLIC_URL is set, use it; otherwise construct from endpoint
    const url = publicUrl
      ? `${publicUrl.replace(/\/+$/, "")}/${key}`
      : `${ENV.r2Endpoint.replace(/\/+$/, "")}/${bucketName}/${key}`;

    return { key, url };
  } catch (error) {
    throw new Error(
      `R2 upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get signed URL for file in Cloudflare R2
 * @param relKey - Relative key (path) for the file in R2
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with key and signed URL
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const { client, bucketName } = getR2Config();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(client, command, { expiresIn });
    return { key, url };
  } catch (error) {
    throw new Error(
      `R2 get URL failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
