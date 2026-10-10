import { createHash } from "node:crypto";
import { isCloudinaryImageUrl } from "@/lib/cloudinary";

type CleanupResult = "deleted" | "already-missing" | "referenced" | "skipped" | "failed";

function publicIdFromCloudinaryUrl(value: string): { publicId: string; folder: "iilm-bnv/applications" | "iilm-bnv/team" | "iilm-bnv/star-ideators" } | null {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return null;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const prefix = `/${cloudName}/image/upload/`;
    if (!url.pathname.startsWith(prefix)) return null;

    const decodedPath = decodeURIComponent(url.pathname);
    const folder = (["iilm-bnv/applications", "iilm-bnv/team", "iilm-bnv/star-ideators"] as const)
      .find((candidate) => decodedPath.includes(`/${candidate}/`));
    if (!folder || !isCloudinaryImageUrl(value, folder)) return null;

    const parts = url.pathname.slice(prefix.length).split("/").filter(Boolean);
    // Remove optional transformations and version segments from delivery URLs.
    if (parts[0] && /[,=]/.test(parts[0])) parts.shift();
    if (parts[0] && /^v\d+$/.test(parts[0])) parts.shift();
    if (!parts.length) return null;
    const last = parts[parts.length - 1];
    parts[parts.length - 1] = last.replace(/\.(?:jpe?g|png|webp|avif|gif)$/i, "");
    const publicId = decodeURIComponent(parts.join("/"));
    if (!publicId.startsWith(`${folder}/`) || publicId.includes("..")) return null;
    return { publicId, folder };
  } catch {
    return null;
  }
}

async function restRows(baseUrl: string, serviceKey: string, path: string): Promise<any[] | null> {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Cloudinary cleanup reference check failed", path, response.status, await response.text().catch(() => ""));
    return null;
  }
  const rows = await response.json().catch(() => null);
  return Array.isArray(rows) ? rows : null;
}

/**
 * Deletes an image only when it belongs to one of this site's managed Cloudinary folders
 * and no other active database record references the exact URL. Reference-check errors fail closed.
 */
export async function deleteCloudinaryImageIfUnused(baseUrl: string, serviceKey: string, imageUrl: unknown): Promise<CleanupResult> {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) return "skipped";
  const asset = publicIdFromCloudinaryUrl(imageUrl.trim());
  if (!asset) return "skipped";

  const encodedUrl = encodeURIComponent(imageUrl.trim());
  let checks: Array<any[] | null>;
  try {
    checks = await Promise.all([
      restRows(baseUrl, serviceKey, `team_members?photo_url=eq.${encodedUrl}&select=id&limit=1`),
      // Archived applications are historical records; their picture is no longer an active use.
      restRows(baseUrl, serviceKey, `applications?profile_picture_url=eq.${encodedUrl}&archived_at=is.null&select=id&limit=1`),
      restRows(baseUrl, serviceKey, `star_ideators?photo_url=eq.${encodedUrl}&select=id&limit=1`),
      restRows(baseUrl, serviceKey, `events?image_url=eq.${encodedUrl}&select=id&limit=1`),
      restRows(baseUrl, serviceKey, `youtube_shorts?thumbnail_url=eq.${encodedUrl}&select=id&limit=1`),
    ]);
  } catch (error) {
    console.error("Cloudinary cleanup reference checks failed", error);
    return "failed";
  }
  if (checks.some((rows) => rows === null)) return "failed";
  if (checks.some((rows) => rows!.length > 0)) return "referenced";

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary cleanup skipped: server-side Cloudinary credentials are not configured.");
    return "failed";
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(`public_id=${asset.publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const body = new URLSearchParams({ public_id: asset.publicId, timestamp, api_key: apiKey, signature });
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Cloudinary image deletion request failed", response.status, result?.error?.message || "Unknown Cloudinary error");
      return "failed";
    }
    if (result?.result === "ok") return "deleted";
    if (result?.result === "not found") return "already-missing";
    console.error("Cloudinary returned an unexpected image deletion result", result?.result || "unknown");
    return "failed";
  } catch (error) {
    console.error("Cloudinary image deletion request failed", error);
    return "failed";
  }
}
