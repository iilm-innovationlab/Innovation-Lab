// Public Cloudinary delivery for site photos (cloud name is public by design; the API secret is never used here).
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "xkrpqbdt";
const CLOUD_RE = /^[a-z0-9_-]{2,64}$/i;
const PUBLIC_ID_RE = /^[a-z0-9_\-/]{1,120}$/i; // blocks "..", query strings, transformation injection

/** Public IDs of photos uploaded to Cloudinary (Media Library public IDs, without extension). */
export const campusImages = {
  left: "campus-starting-left",
  right: "campus-starting-right",
} as const;

export const cloudinaryConfigured = CLOUD_RE.test(CLOUD_NAME);

/** next/image loader: Cloudinary resizes (never upscales) and picks AVIF/WebP/JPEG per browser. */
export function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!cloudinaryConfigured || !PUBLIC_ID_RE.test(src) || src.includes("..")) return "";
  const w = Math.max(160, Math.min(2000, Math.round(width)));
  const q = quality ? `q_${Math.min(100, Math.max(40, Math.round(quality)))}` : "q_auto:good";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,${q},c_limit,w_${w}/${src}`;
}
