/**
 * Cloudflare R2 Image Upload Service
 * 
 * Provides image upload functionality using Cloudflare R2 (S3-compatible storage).
 * Supports Base64 image uploads with automatic URL generation.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

// Initialize S3 client for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  throw new Error("Missing required R2 environment variables");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a random filename with timestamp
 */
function generateFilename(extension: string = "jpg"): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString("hex");
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Detect image MIME type from Base64 string
 */
function detectMimeType(base64: string): string {
  if (base64.startsWith("data:image/png")) return "image/png";
  if (base64.startsWith("data:image/jpeg") || base64.startsWith("data:image/jpg")) return "image/jpeg";
  if (base64.startsWith("data:image/webp")) return "image/webp";
  if (base64.startsWith("data:image/gif")) return "image/gif";
  return "image/jpeg"; // Default
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "jpg";
}

/**
 * Upload a Base64 image to Cloudflare R2
 * 
 * @param base64Image - Base64 encoded image string (with or without data URI prefix)
 * @param folder - Optional folder path (e.g., "timeline-notes", "thumbnails")
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToR2(
  base64Image: string,
  folder: string = "timeline-notes"
): Promise<string> {
  try {
    // Remove data URI prefix if present
    let base64Data = base64Image;
    const mimeType = detectMimeType(base64Image);
    
    if (base64Image.includes("base64,")) {
      base64Data = base64Image.split("base64,")[1];
    }

    // Convert Base64 to Buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Generate filename
    const extension = getExtensionFromMimeType(mimeType);
    const filename = generateFilename(extension);
    const key = folder ? `${folder}/${filename}` : filename;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Upload multiple Base64 images to Cloudflare R2
 * 
 * @param base64Images - Array of Base64 encoded image strings
 * @param folder - Optional folder path
 * @returns Array of public URLs
 */
export async function uploadImagesToR2(
  base64Images: string[],
  folder: string = "timeline-notes"
): Promise<string[]> {
  const uploadPromises = base64Images.map((image) => uploadImageToR2(image, folder));
  return Promise.all(uploadPromises);
}

/**
 * Validate Base64 image string
 * 
 * @param base64Image - Base64 encoded image string
 * @returns True if valid, false otherwise
 */
export function validateBase64Image(base64Image: string): boolean {
  try {
    // Check if it's a valid Base64 string
    if (!base64Image || typeof base64Image !== "string") {
      return false;
    }

    // Check if it has data URI prefix
    if (base64Image.startsWith("data:image/")) {
      const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
      return matches !== null && matches.length === 3;
    }

    // Try to decode as plain Base64
    const decoded = Buffer.from(base64Image, "base64").toString("base64");
    return decoded === base64Image;
  } catch {
    return false;
  }
}

/**
 * Get image size from Base64 string (in bytes)
 * 
 * @param base64Image - Base64 encoded image string
 * @returns Size in bytes
 */
export function getBase64ImageSize(base64Image: string): number {
  let base64Data = base64Image;
  if (base64Image.includes("base64,")) {
    base64Data = base64Image.split("base64,")[1];
  }
  return Buffer.from(base64Data, "base64").length;
}
