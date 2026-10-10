import { NextResponse } from "next/server";
import { isCloudinaryImageUrl } from "@/lib/cloudinary";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit";

const TYPES = new Set(["explorer", "ideator", "campus_innovation_fellow", "social_media"]);
const PHOTO_TYPES = new Set(["campus_innovation_fellow", "social_media"]);
const MAX_BODY = 256 * 1024;
const MAX_FIELD = 4_000;

function clean(value: unknown, max = MAX_FIELD) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Only ordinary form answers belong in JSONB. Image bytes are uploaded directly from the
// browser to Cloudinary and represented in Supabase solely by profile_picture_url. This also
// protects against clients placing data:image URLs or base64 image payloads inside JSON fields.
function cleanPayloadValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^data:image\//i.test(trimmed)) return undefined;
    // Large bare base64 blobs are not valid application answers. Normal links/text remain valid.
    if (trimmed.length > 100_000 && /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed)) return undefined;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(cleanPayloadValue).filter((entry) => entry !== undefined);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      // Image/file fields must use the dedicated direct-to-Cloudinary upload, never JSON payload.
      if (/(?:image|photo|picture|avatar|file|base64)/i.test(key)) continue;
      const cleaned = cleanPayloadValue(item);
      if (cleaned !== undefined) result[key] = cleaned;
    }
    return result;
  }
  return value === null || typeof value === "number" || typeof value === "boolean" ? value : undefined;
}

function cleanPayload(value: unknown): Record<string, unknown> {
  const cleaned = cleanPayloadValue(value);
  return cleaned && typeof cleaned === "object" && !Array.isArray(cleaned) ? cleaned as Record<string, unknown> : {};
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ ok: false, error: "Application service is not configured." }, { status: 503 });

  try {
    // Image binaries must never pass through this Vercel endpoint. The browser uploads
    // directly to Cloudinary and submits only the resulting URL with the application.
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY) return NextResponse.json({ ok: false, error: "Application is too large." }, { status: 413 });
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      return NextResponse.json({ ok: false, error: "Submit application details as JSON. Upload pictures directly to Cloudinary first." }, { status: 415 });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "Application is too large." }, { status: 413 });
    const input = JSON.parse(raw) as Record<string, unknown>;

    const type = clean(input.type, 40);
    const fullName = clean(input.full_name, 160);
    const email = clean(input.email, 254).toLowerCase();
    const honeypot = clean(input.website, 200);
    if (honeypot) return NextResponse.json({ ok: true });
    if (!TYPES.has(type)) return NextResponse.json({ ok: false, error: "Invalid application type." }, { status: 400 });
    if (fullName.length < 2) return NextResponse.json({ ok: false, error: "Please enter your full name." }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    const submittedPictureUrl = typeof input.profile_picture_url === "string" && input.profile_picture_url.trim() ? input.profile_picture_url.trim() : null;
    if (submittedPictureUrl && !PHOTO_TYPES.has(type)) return NextResponse.json({ ok: false, error: "Profile pictures are available on the Campus Innovation Fellow and Social Media forms only." }, { status: 400 });
    if (submittedPictureUrl && !isCloudinaryImageUrl(submittedPictureUrl, "iilm-bnv/applications")) {
      return NextResponse.json({ ok: false, error: "The profile picture must be uploaded to the approved Cloudinary application folder." }, { status: 400 });
    }
    const profilePictureUrl = submittedPictureUrl;

    // A small database-backed limit protects both the application table and service-role API
    // from accidental loops and basic automated spam. This is intentionally per client IP.
    const rateLimit = await enforcePublicRateLimit(request, "application-submit", 10, 60 * 60);
    if (rateLimit.reason === "unavailable") {
      return NextResponse.json({ ok: false, error: "Application protection is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, error: "Too many applications were submitted from this network. Please try again in about an hour." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    }

    const payload = cleanPayload(input.payload);
    const submittedStage = clean(input.current_stage, 160);
    if (submittedStage) payload.submitted_stage = submittedStage;
    const row = {
      type,
      full_name: fullName,
      email,
      phone: clean(input.phone, 40) || null,
      campus: clean(input.campus, 120) || null,
      degree: clean(input.degree, 180) || null,
      year: clean(input.year, 40) || null,
      current_stage: submittedStage || null,
      idea: clean(input.idea) || null,
      problem: clean(input.problem) || null,
      target_users: clean(input.target_users) || null,
      prototype_url: clean(input.prototype_url, 1_000) || null,
      message: clean(input.message) || null,
      payload,
      profile_picture_url: profilePictureUrl,
      status: "new",
    };

    const response = await fetch(`${url}/rest/v1/applications`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Application insert failed", detail);
      return NextResponse.json({ ok: false, error: "We could not submit your application. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Application request failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid application request." }, { status: 400 });
  }
}
