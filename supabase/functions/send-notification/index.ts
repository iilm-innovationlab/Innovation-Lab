// Deploy with: supabase functions deploy send-notification
// Set VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as function secrets.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("authorization") || "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin"].includes(profile.role)) return new Response("Forbidden", { status: 403 });

  const payload = await req.json();
  const title = String(payload?.title || "IILM × BNV Innovation Lab").slice(0, 120);
  const body = String(payload?.body || "New update from the Lab.").slice(0, 240);
  const url = String(payload?.url || "/").slice(0, 500);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  const { data: subscriptions, error } = await supabase.from("notification_subscriptions").select("id,endpoint,p256dh,auth").limit(5000);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let sent = 0;
  const stale: string[] = [];
  for (const sub of subscriptions || []) {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({ title, body, url })); sent++; }
    catch (err) { if ((err as { statusCode?: number })?.statusCode === 404 || (err as { statusCode?: number })?.statusCode === 410) stale.push(sub.id); }
  }
  if (stale.length) await supabase.from("notification_subscriptions").delete().in("id", stale);
  return Response.json({ ok: true, sent, removed: stale.length });
});
