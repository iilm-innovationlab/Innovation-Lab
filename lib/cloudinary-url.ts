/**
 * Return one standardized, cache-friendly Cloudinary rendition for profile photos.
 * The original URL remains in Supabase; the browser downloads a small responsive
 * derivative instead of a potentially multi-megabyte uploaded original.
 */
export function optimizedCloudinaryImageUrl(value: string | null | undefined, width = 480): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return value;
    const marker = "/image/upload/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return value;
    const afterUpload = url.pathname.slice(index + marker.length);
    // Do not stack transformations if this URL is already transformed.
    if (/^(?:f_auto|q_auto|w_\d+|h_\d+|c_fill|g_auto)(?:,|\/)/.test(afterUpload)) return value;
    const safeWidth = Math.max(160, Math.min(960, Math.round(width)));
    url.pathname = `${url.pathname.slice(0, index + marker.length)}f_auto,q_auto,w_${safeWidth},h_${safeWidth},c_fill,g_auto/${afterUpload}`;
    return url.toString();
  } catch {
    return value;
  }
}
