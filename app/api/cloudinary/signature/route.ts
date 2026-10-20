import { NextResponse } from "next/server";
import { createCloudinaryUploadSignature, type CloudinaryUploadFolder } from "@/lib/cloudinary";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit";

async function isAuthorizedAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!url || !anon || !serviceKey || !token) return false;
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!userResponse.ok) return false;
  const user = await userResponse.json();
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role&limit=1`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
  if (!profileResponse.ok) return false;
  const profiles = await profileResponse.json();
  return Array.isArray(profiles) && profiles[0]?.id === user.id && profiles[0]?.role === "admin";
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
          return NextResponse.json({ ok: false, error: "Cross-origin image signing requests are not allowed." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
      }
    }
    const body = await request.json().catch(() => ({}));
    const purpose = body?.purpose;
    let folder: CloudinaryUploadFolder;
    if (purpose === "application") {
      folder = "iilm-bnv/applications";
    } else if (purpose === "team") {
      if (!(await isAuthorizedAdmin(request))) return NextResponse.json({ ok: false, error: "Only an authorized admin can upload a team profile picture." }, { status: 403 });
      folder = "iilm-bnv/team";
    } else if (purpose === "star-ideators") {
      if (!(await isAuthorizedAdmin(request))) return NextResponse.json({ ok: false, error: "Only an authorized admin can upload a Star Ideator picture." }, { status: 403 });
      folder = "iilm-bnv/star-ideators";
    } else if (purpose === "event-gallery") {
      if (!(await isAuthorizedAdmin(request))) return NextResponse.json({ ok: false, error: "Only an authorized admin can upload event gallery photos." }, { status: 403 });
      folder = "iilm-bnv/event-gallery";
    } else {
      return NextResponse.json({ ok: false, error: "Invalid image upload purpose." }, { status: 400 });
    }
    const rateLimit = await enforcePublicRateLimit(request, `cloudinary-signature-${purpose}`, purpose === "application" ? 20 : 30, 60 * 60);
    if (!rateLimit.allowed && rateLimit.reason === "unavailable") {
      return NextResponse.json({ ok: false, error: "Upload protection is temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, error: "Too many image upload attempts from this network. Please try again later." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    }
    const signed = createCloudinaryUploadSignature(folder);
    return NextResponse.json({ ok: true, ...signed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cloudinary signature request failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not prepare image upload." }, { status: 503 });
  }
}
