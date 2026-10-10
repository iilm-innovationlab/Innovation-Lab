"use client";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadPurpose = "application" | "team" | "star-ideators";

async function optimizeProfileImage(file: File): Promise<File> {
  // Resize/encode locally so a multi-megabyte phone photo does not become the stored original.
  // If the browser cannot decode/encode this image, safely fall back to the validated original.
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const maxDimension = 1200;
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.size <= 350 * 1024 && file.type === "image/webp") return file;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (!blob || blob.size <= 0 || blob.size >= file.size) return file;
      const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-photo";
      return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

export async function uploadImageDirectToCloudinary(file: File, purpose: UploadPurpose, accessToken?: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Profile picture must be between 1 byte and 5 MB.");
  const uploadFile = await optimizeProfileImage(file);

  // Ask Vercel only for a signature. The file itself goes straight from this browser to Cloudinary.
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify({ purpose }),
    cache: "no-store",
  });
  const signed = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok || !signed?.ok) throw new Error(signed?.error || "Could not prepare the secure image upload.");

  const upload = new FormData();
  upload.set("file", uploadFile);
  upload.set("api_key", signed.apiKey);
  upload.set("timestamp", String(signed.timestamp));
  upload.set("folder", signed.folder);
  upload.set("asset_folder", signed.assetFolder);
  upload.set("public_id_prefix", signed.publicIdPrefix);
  upload.set("public_id", signed.publicId);
  upload.set("overwrite", String(signed.overwrite));
  upload.set("signature", signed.signature);
  upload.set("allowed_formats", signed.allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, {
    method: "POST",
    body: upload,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result?.secure_url !== "string") {
    throw new Error("Cloudinary could not upload this picture. Please try again or submit without a picture.");
  }

  const expectedFolder = purpose === "application" ? "iilm-bnv/applications" : purpose === "star-ideators" ? "iilm-bnv/star-ideators" : "iilm-bnv/team";
  let valid = false;
  try {
    const url = new URL(result.secure_url);
    const path = decodeURIComponent(url.pathname);
    valid = url.protocol === "https:" && url.hostname === "res.cloudinary.com" &&
      path.startsWith(`/${signed.cloudName}/image/upload/`) && path.includes(`/${expectedFolder}/`);
  } catch { valid = false; }
  if (!valid) throw new Error("Cloudinary returned an unexpected image URL. The picture was not attached to the form.");
  return result.secure_url;
}
