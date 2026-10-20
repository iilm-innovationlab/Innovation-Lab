import { createHash, randomUUID } from "node:crypto";

export const CLOUDINARY_ALLOWED_FORMATS = "jpg,png,webp";
export type CloudinaryUploadFolder = "iilm-bnv/applications" | "iilm-bnv/team" | "iilm-bnv/star-ideators" | "iilm-bnv/event-gallery";

/**
 * Create a short-lived signed upload configuration. The image is uploaded by the
 * browser directly to Cloudinary; it is never proxied through a Vercel function.
 */
export function createCloudinaryUploadSignature(folder: CloudinaryUploadFolder) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary uploads are not configured. Add the server-side Cloudinary environment variables.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Bind each short-lived signature to one unique, non-overwritable asset ID. This prevents
  // someone from replaying a single leaked signature to create unlimited assets.
  const publicId = `profile-${randomUUID()}`;
  const params = {
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
    asset_folder: folder,
    folder,
    overwrite: "false",
    public_id: publicId,
    public_id_prefix: folder,
    timestamp,
  };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, timestamp, folder, assetFolder: folder, publicIdPrefix: folder, publicId, overwrite: false, signature, allowedFormats: CLOUDINARY_ALLOWED_FORMATS };
}

/** Accept only HTTPS URLs from this configured Cloudinary cloud and expected folder. */
export function isCloudinaryImageUrl(value: unknown, expectedFolder: CloudinaryUploadFolder): value is string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (typeof value !== "string" || !cloudName) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return false;
    const path = decodeURIComponent(url.pathname);
    return path.startsWith(`/${cloudName}/image/upload/`) && path.includes(`/${expectedFolder}/`);
  } catch {
    return false;
  }
}
