import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isCloudinaryImageUrl } from "@/lib/cloudinary";

const ALLOWED_TEAMS = new Set(["Campus Innovation Fellow", "Social Media"]);
const TEAM_APPLICATION_TYPES = new Set(["campus_innovation_fellow", "social_media"]);
function clean(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

async function getAuthenticatedProfile(request: Request) {
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
  const profiles = await profileResponse.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  return profile?.role === "admin" ? { url, serviceKey, actor: profile } : null;
}

async function rest(url: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers({ apikey: serviceKey, Authorization: `Bearer ${serviceKey}` });
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
}

async function archiveApplication(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedProfile>>>, application: any) {
  const archivedAt = new Date().toISOString();
  const actorName = auth.actor.full_name || auth.actor.email || "Admin";
  const changes = { status: "accepted", current_stage: "Added to team", archived_at: archivedAt, archived_by: auth.actor.id, archived_by_name: actorName, reviewed_by: auth.actor.id, reviewed_by_name: actorName, reviewed_at: archivedAt };
  const response = await rest(auth.url, auth.serviceKey, `applications?id=eq.${encodeURIComponent(application.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []);
  const updated = Array.isArray(rows) ? rows.find((row: any) => row.id === application.id && row.archived_at) : null;
  if (!updated) return false;
  const auditResponse = await rest(auth.url, auth.serviceKey, "audit_logs", {
    method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ table_name: "applications", record_id: application.id, action: "UPDATE", changed_by: auth.actor.id, changed_by_name: actorName, old_data: application, new_data: { ...application, ...updated } }),
  });
  if (!auditResponse.ok) console.error("Application archive actor audit insert failed", await auditResponse.text().catch(() => ""));
  return true;
}

async function deleteTeamMember(auth: NonNullable<Awaited<ReturnType<typeof getAuthenticatedProfile>>>, id: string) {
  await rest(auth.url, auth.serviceKey, `team_members?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => undefined);
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Only an authorized admin can add team members." }, { status: 403 });

  let newlyInsertedMemberId = "";
  try {
    // JSON-only API: uploaded file bytes must go directly from the browser to Cloudinary.
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      return NextResponse.json({ ok: false, error: "Send team profile details as JSON. Upload pictures directly to Cloudinary first." }, { status: 415 });
    }
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 32 * 1024) return NextResponse.json({ ok: false, error: "Team profile details are too large." }, { status: 413 });
    const body = await request.json().catch(() => ({}));
    const applicationId = clean(body.application_id, 80);
    const submittedPhotoUrl = clean(body.photo_url, 2_000) || null;

    let application: any = null;
    let name = clean(body.name, 160);
    let role = clean(body.role, 160) || null;
    let campus = clean(body.campus, 120) || "Greater Noida";
    let team = clean(body.team, 80);
    let contactEmail = clean(body.contact_email, 254).toLowerCase();
    let photoUrl: string | null = null;

    if (applicationId) {
      const appResponse = await rest(auth.url, auth.serviceKey, `applications?id=eq.${encodeURIComponent(applicationId)}&select=id,type,full_name,email,campus,payload,profile_picture_url,status,current_stage,archived_at&limit=1`);
      if (!appResponse.ok) throw new Error("Could not load the selected application. Check the database migration and try again.");
      const apps = await appResponse.json().catch(() => []);
      application = Array.isArray(apps) ? apps[0] : null;
      if (!application) return NextResponse.json({ ok: false, error: "Application not found. Refresh the Applications list." }, { status: 404 });
      if (!TEAM_APPLICATION_TYPES.has(application.type)) return NextResponse.json({ ok: false, error: "Only Campus Innovation Fellow and Social Media applications can be onboarded here." }, { status: 400 });
      if (application.archived_at || (application.status === "accepted" && application.current_stage === "Added to team")) return NextResponse.json({ ok: false, error: "This application has already been onboarded." }, { status: 409 });
      name = clean(application.full_name, 160);
      contactEmail = clean(application.email, 254).toLowerCase();
      campus = clean(application.campus, 120) || "Greater Noida";
      team = application.type === "social_media" ? "Social Media" : "Campus Innovation Fellow";
      const roles = (application.payload && Array.isArray(application.payload.roles)) ? application.payload.roles.map((item: unknown) => clean(item, 100)).filter(Boolean) : [];
      role = application.type === "social_media" ? (roles.join(", ") || "Social Media Team Member") : "Campus Innovation Fellow";
      photoUrl = typeof application.profile_picture_url === "string" ? application.profile_picture_url : null;
      if (photoUrl && !isCloudinaryImageUrl(photoUrl, "iilm-bnv/applications")) {
        return NextResponse.json({ ok: false, error: "The applicant profile picture is not a valid Cloudinary application image URL." }, { status: 400 });
      }
    } else {
      photoUrl = submittedPhotoUrl;
      if (photoUrl && !isCloudinaryImageUrl(photoUrl, "iilm-bnv/team")) {
        return NextResponse.json({ ok: false, error: "Upload the team profile picture directly to the approved Cloudinary team folder first." }, { status: 400 });
      }
    }

    if (name.length < 2) return NextResponse.json({ ok: false, error: "Please enter the member's full name." }, { status: 400 });
    if (!ALLOWED_TEAMS.has(team)) return NextResponse.json({ ok: false, error: "Please choose a valid team." }, { status: 400 });
    if (contactEmail && !validEmail(contactEmail)) return NextResponse.json({ ok: false, error: "Please enter a valid contact email." }, { status: 400 });
    if (!contactEmail && applicationId) return NextResponse.json({ ok: false, error: "The application does not contain a valid email address." }, { status: 400 });

    if (contactEmail) {
      const existingResponse = await rest(auth.url, auth.serviceKey, `team_members?contact_email=eq.${encodeURIComponent(contactEmail)}&team=eq.${encodeURIComponent(team)}&select=id,name,role,campus,team,photo_url,email,contact_email,published&limit=1`);
      if (!existingResponse.ok) throw new Error("Could not check whether this student is already on the team.");
      const existingRows = await existingResponse.json().catch(() => []);
      const existing = Array.isArray(existingRows) ? existingRows[0] : null;
      if (existing) {
        if (!application) return NextResponse.json({ ok: false, error: "A team profile already exists for this contact email and team." }, { status: 409 });
        if (!existing.photo_url && photoUrl) {
          const photoPatch = await rest(auth.url, auth.serviceKey, `team_members?id=eq.${encodeURIComponent(existing.id)}`, {
            method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ photo_url: photoUrl, updated_by: auth.actor.id, updated_by_name: auth.actor.full_name || auth.actor.email || "Admin" }),
          });
          if (!photoPatch.ok) return NextResponse.json({ ok: false, error: "This student already has a team profile, but its profile picture could not be updated." }, { status: 502 });
          await rest(auth.url, auth.serviceKey, "audit_logs", {
            method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ table_name: "team_members", record_id: existing.id, action: "UPDATE", changed_by: auth.actor.id, changed_by_name: auth.actor.full_name || auth.actor.email || "Admin", old_data: existing, new_data: { ...existing, photo_url: photoUrl } }),
          });
        }
        const archived = await archiveApplication(auth, application);
        if (!archived) return NextResponse.json({ ok: false, error: "This student already has a team profile, but the application could not be archived. Please retry after refreshing." }, { status: 502 });
        revalidatePath("/team"); revalidatePath("/"); revalidateTag("public-team", { expire: 0 });
        return NextResponse.json({ ok: true, alreadyOnTeam: true, member: { id: existing.id, name: existing.name, role: existing.role, campus: existing.campus, team: existing.team, photo_url: existing.photo_url || photoUrl, email: existing.email || existing.contact_email, published: existing.published ?? true } }, { status: 200 });
      }
    }

    const insertResponse = await rest(auth.url, auth.serviceKey, "team_members", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ name, role, campus, team, photo_url: photoUrl, published: true, auth_user_id: null, email: contactEmail || null, contact_email: contactEmail || null, created_by: auth.actor.id, created_by_name: auth.actor.full_name || auth.actor.email || "Admin" }),
    });
    const rows = await insertResponse.json().catch(() => ({}));
    if (!insertResponse.ok) { console.error("Team profile insert failed", rows); return NextResponse.json({ ok: false, error: "Could not save the team profile. No Supabase Auth account was created." }, { status: 502 }); }
    const member = Array.isArray(rows) ? rows[0] : rows;
    if (!member?.id) throw new Error("The team profile was saved, but the database did not return its ID.");
    newlyInsertedMemberId = String(member.id);
    const teamAuditResponse = await rest(auth.url, auth.serviceKey, "audit_logs", {
      method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ table_name: "team_members", record_id: member.id, action: "INSERT", changed_by: auth.actor.id, changed_by_name: auth.actor.full_name || auth.actor.email || "Admin", new_data: { id: member.id, name, role, campus, team, email: contactEmail || null, photo_url: photoUrl, published: true } }),
    });
    if (!teamAuditResponse.ok) {
      await deleteTeamMember(auth, newlyInsertedMemberId);
      newlyInsertedMemberId = "";
      console.error("Team profile actor audit insert failed", await teamAuditResponse.text().catch(() => ""));
      throw new Error("The team profile could not be audited, so onboarding was cancelled. Please try again.");
    }

    if (application) {
      const archived = await archiveApplication(auth, application);
      if (!archived) {
        await deleteTeamMember(auth, newlyInsertedMemberId);
        newlyInsertedMemberId = "";
        return NextResponse.json({ ok: false, error: "The team profile could not be finalized because the application could not be archived. No duplicate team profile was left behind; refresh and retry." }, { status: 502 });
      }
    }

    revalidatePath("/team");
    revalidatePath("/");
    revalidateTag("public-team", { expire: 0 });
    return NextResponse.json({ ok: true, member: { id: member.id, name: member.name || name, role: member.role || role, campus: member.campus || campus, team: member.team || team, photo_url: member.photo_url || photoUrl, email: member.email || contactEmail || null, contact_email: member.contact_email || contactEmail || null, published: member.published ?? true } }, { status: 201 });
  } catch (error) {
    if (newlyInsertedMemberId) await deleteTeamMember(auth, newlyInsertedMemberId);
    console.error("Team profile onboarding failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not add team member." }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Only an authorized admin can update team members." }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = clean(body.id, 80);
    if (!id || typeof body.published !== "boolean") {
      return NextResponse.json({ ok: false, error: "A team member ID and publishing state are required." }, { status: 400 });
    }

    const currentResponse = await rest(auth.url, auth.serviceKey, `team_members?id=eq.${encodeURIComponent(id)}&select=id,name,role,campus,team,published&limit=1`);
    if (!currentResponse.ok) return NextResponse.json({ ok: false, error: "Could not load the team member." }, { status: 502 });
    const currentRows = await currentResponse.json().catch(() => []);
    const current = Array.isArray(currentRows) ? currentRows[0] : null;
    if (!current) return NextResponse.json({ ok: false, error: "Team member not found." }, { status: 404 });

    const actorName = auth.actor.full_name || auth.actor.email || "Admin";
    const updateResponse = await rest(auth.url, auth.serviceKey, `team_members?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ published: body.published, updated_by: auth.actor.id, updated_by_name: actorName }),
    });
    if (!updateResponse.ok) return NextResponse.json({ ok: false, error: "Could not update team member visibility." }, { status: 502 });
    const updatedRows = await updateResponse.json().catch(() => []);
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;
    if (!updated) return NextResponse.json({ ok: false, error: "The team member visibility was not updated." }, { status: 502 });

    const auditResponse = await rest(auth.url, auth.serviceKey, "audit_logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ table_name: "team_members", record_id: id, action: "UPDATE", changed_by: auth.actor.id, changed_by_name: actorName, old_data: current, new_data: updated }),
    });
    if (!auditResponse.ok) console.error("Team publishing audit insert failed", await auditResponse.text().catch(() => ""));

    revalidatePath("/team");
    revalidatePath("/");
    revalidateTag("public-team", { expire: 0 });
    return NextResponse.json({ ok: true, member: updated });
  } catch (error) {
    console.error("Team publishing update failed", error);
    return NextResponse.json({ ok: false, error: "Could not update team member visibility." }, { status: 500 });
  }
}
