import { NextResponse } from "next/server";
import { deleteCloudinaryImageIfUnused } from "@/lib/cloudinary-cleanup";

async function getAuthorizedAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!url || !anon || !serviceKey || !token) return null;
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,full_name,email&limit=1`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json().catch(() => []);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  return profile?.role === "admin" ? { url, serviceKey, actor: profile } : null;
}

async function rest(url: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers({ apikey: serviceKey, Authorization: `Bearer ${serviceKey}` });
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
}

/** Protected deletion endpoint for admin workflows. No UI controls are added or changed here. */
export async function DELETE(request: Request) {
  const auth = await getAuthorizedAdmin(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Only an authorized admin can delete applications." }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim().slice(0, 80) : "";
    if (!id) return NextResponse.json({ ok: false, error: "An application ID is required." }, { status: 400 });

    const currentResponse = await rest(auth.url, auth.serviceKey, `applications?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (!currentResponse.ok) return NextResponse.json({ ok: false, error: "Could not load the application before deletion." }, { status: 502 });
    const rows = await currentResponse.json().catch(() => []);
    const current = Array.isArray(rows) ? rows[0] : null;
    if (!current) return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });

    const actorName = auth.actor.full_name || auth.actor.email || "Admin";
    const auditResponse = await rest(auth.url, auth.serviceKey, "audit_logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ table_name: "applications", record_id: id, action: "DELETE", changed_by: auth.actor.id, changed_by_name: actorName, old_data: current, new_data: null }),
    });
    if (!auditResponse.ok) {
      console.error("Application deletion audit insert failed", await auditResponse.text().catch(() => ""));
      return NextResponse.json({ ok: false, error: "Deletion was cancelled because the activity log could not be saved." }, { status: 502 });
    }

    const deleteResponse = await rest(auth.url, auth.serviceKey, `applications?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    if (!deleteResponse.ok) return NextResponse.json({ ok: false, error: "Could not delete application from the database." }, { status: 502 });
    const deleted = await deleteResponse.json().catch(() => []);
    if (!Array.isArray(deleted) || !deleted.some((row: any) => String(row.id) === id)) {
      return NextResponse.json({ ok: false, error: "No application was deleted. Check database permissions and try again." }, { status: 502 });
    }

    const cleanupStatus = await deleteCloudinaryImageIfUnused(auth.url, auth.serviceKey, current.profile_picture_url);
    if (cleanupStatus === "failed") console.error("Application was deleted, but its Cloudinary image cleanup needs retry", { applicationId: id });
    return NextResponse.json({ ok: true, cleanupStatus });
  } catch (error) {
    console.error("Application deletion failed", error);
    return NextResponse.json({ ok: false, error: "Could not delete application." }, { status: 500 });
  }
}
