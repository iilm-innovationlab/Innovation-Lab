import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const getServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function PATCH(request: NextRequest) {
  const url = getUrl();
  const key = getServiceKey();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!url || !key || !token) return NextResponse.json({ error: "Missing Supabase configuration or session." }, { status: 401 });
  try {
    const authResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!authResponse.ok) return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });
    const user = await authResponse.json();
    const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,full_name,email&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!profileResponse.ok) return NextResponse.json({ error: "Could not verify your admin profile." }, { status: 500 });
    const profiles = await profileResponse.json();
    const actor = Array.isArray(profiles) ? profiles[0] : null;
    if (!actor || actor.id !== user.id || actor.role !== "admin") return NextResponse.json({ error: "This account is not authorized for Admin Studio." }, { status: 403 });
    const body = await request.json();
    const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
    if (fullName.length < 2) return NextResponse.json({ error: "Enter a name with at least 2 characters." }, { status: 400 });
    const updateResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
      method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ full_name: fullName, email: user.email || actor.email }), cache: "no-store",
    });
    const updatedRows = await updateResponse.json().catch(() => []);
    if (!updateResponse.ok) return NextResponse.json({ error: "Could not save your display name." }, { status: 502 });
    await fetch(`${url}/rest/v1/audit_logs`, {
      method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ table_name: "profiles", record_id: user.id, action: "UPDATE", changed_by: user.id, changed_by_name: actor.full_name || actor.email || user.email || "Admin", old_data: { full_name: actor.full_name }, new_data: { full_name: fullName } }), cache: "no-store",
    });
    return NextResponse.json({ ok: true, profile: Array.isArray(updatedRows) ? updatedRows[0] : null });
  } catch (error) {
    console.error("Admin profile update failed", error);
    return NextResponse.json({ error: "Could not update the profile. Please try again." }, { status: 500 });
  }
}
