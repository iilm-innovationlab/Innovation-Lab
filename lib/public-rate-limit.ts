import { createHash } from "node:crypto";

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "limited" | "unavailable" };

/** Database-backed, atomic rate limiting; the raw client IP is never persisted. */
export async function enforcePublicRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { allowed: false, reason: "unavailable" };

  // Vercel appends the client address to X-Forwarded-For. Prefer its direct IP header
  // when available; use the last forwarded value instead of a caller-controlled first value.
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = request.headers.get("x-real-ip")?.trim() || forwarded?.split(",").pop()?.trim() || "unknown";
  const keyHash = createHash("sha256").update(`${serviceKey}:${scope}:${clientIp}`).digest("hex");

  try {
    const response = await fetch(`${url}/rest/v1/rpc/consume_public_rate_limit`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds }),
      cache: "no-store",
    });
    if (!response.ok) return { allowed: false, reason: "unavailable" };
    const result: unknown = await response.json();
    return result === true ? { allowed: true } : { allowed: false, reason: "limited" };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}
