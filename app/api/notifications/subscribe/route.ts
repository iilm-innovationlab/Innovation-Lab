import { NextResponse } from "next/server";

const MAX_BODY = 12_000;

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "Notifications are not configured." }, { status: 503 });

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "Subscription payload is too large." }, { status: 413 });
    const body = JSON.parse(raw) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
    const auth = typeof body.keys?.auth === "string" ? body.keys.auth.trim() : "";
    if (!endpoint.startsWith("https://") || endpoint.length < 20 || endpoint.length > 2000) return NextResponse.json({ ok: false, error: "Invalid push endpoint." }, { status: 400 });
    if (p256dh.length < 20 || p256dh.length > 500 || auth.length < 10 || auth.length > 500) return NextResponse.json({ ok: false, error: "Invalid push subscription keys." }, { status: 400 });

    const response = await fetch(`${url}/rest/v1/notification_subscriptions?on_conflict=endpoint`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ endpoint, p256dh, auth, user_agent: request.headers.get("user-agent")?.slice(0, 500) || null }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ ok: false, error: "Could not save subscription." }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
