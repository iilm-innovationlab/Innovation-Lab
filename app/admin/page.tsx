"use client";

import { useEffect, useMemo, useState } from "react";
import { uploadImageDirectToCloudinary } from "@/lib/cloudinary-client";
import type { FormEvent } from "react";
import Link from "next/link";
import AdminAuth, { type AdminIdentity } from "@/components/AdminAuth";
import { restInsert, restSelect, supabaseConfigured } from "@/lib/supabase-rest";
import BackupSettings from "@/components/BackupSettings";
import { optimizedCloudinaryImageUrl } from "@/lib/cloudinary-url";

type Status = "Published" | "Draft" | "New" | "Review" | "Active";
type ModuleKey = "overview" | "applications" | "events" | "team" | "communities" | "social" | "announcements" | "star-ideators" | "settings" | "audit";

type Application = { id: string; name: string; type: string; email: string; stage: string; status: Status; date: string; phone?: string; campus?: string; degree?: string; year?: string; idea?: string; problem?: string; targetUsers?: string; prototypeUrl?: string; message?: string; reviewNotes?: string; payload?: Record<string, unknown>; createdAt?: string; profilePictureUrl?: string; archivedAt?: string };
type EventItem = { id: string; title: string; date: string; community: string; status: Status; updatedBy?: string; startsAt?: string; description?: string; registrationUrl?: string; createdAt?: string };
type TeamMember = { id: string; name: string; role?: string; campus: string; team: string; status: Status; email?: string; photoUrl?: string; yearOfStudy?: string; degreeProgram?: string };

const nav: { key: ModuleKey; label: string; icon: string; badge?: string }[] = [
  { key: "overview", label: "Overview", icon: "⌂" },
  { key: "applications", label: "Applications", icon: "✦" },
  { key: "star-ideators", label: "Star Ideators", icon: "★" },
  { key: "events", label: "Events", icon: "◷" },
  { key: "team", label: "Team", icon: "◌" },
  { key: "communities", label: "Communities", icon: "◎" },
  { key: "social", label: "Social", icon: "▶" },
  { key: "announcements", label: "Announcements", icon: "!" },
  { key: "settings", label: "Settings", icon: "⚙" },
];

function isArchivedTeamApplication(application: Application) { return Boolean(application.archivedAt) || ((application.type === "Campus Innovation Fellow" || application.type === "Social Media") && application.status === "Active" && application.stage === "Added to team"); }

function Badge({ status }: { status: Status }) {
  return <span className={`admin-badge admin-badge-${status.toLowerCase()}`}><i />{status}</span>;
}

function StatCard({ label, value, delta, tone = "navy" }: { label: string; value: string; delta: string; tone?: string }) {
  return <div className={`admin-stat admin-stat-${tone}`}><span>{label}</span><strong>{value}</strong><small>{delta}</small></div>;
}

function readSession() {
  try {
    const raw = window.localStorage.getItem("iilm-admin-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


type InlineAuditRow = { record_id: string | null; action: string; changed_by_name: string; changed_at: string; new_data?: Record<string, unknown> | null };
function useInlineAudit(tableName: string, enabled = true) {
  const [rows, setRows] = useState<InlineAuditRow[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!enabled) return;
      try {
        const session = readSession();
        if (!session?.access_token) return;
        const since = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        const result = await restSelect("audit_logs", session.access_token, `select=record_id,action,changed_by_name,changed_at,new_data&table_name=eq.${encodeURIComponent(tableName)}&changed_at=gte.${encodeURIComponent(since)}&order=changed_at.desc&limit=500`);
        if (active && Array.isArray(result)) setRows(result as InlineAuditRow[]);
      } catch (error) { console.warn(`Could not load ${tableName} activity`, error); }
    };
    void load();
    return () => { active = false; };
  }, [tableName, enabled]);
  return useMemo(() => {
    const latest = new Map<string, InlineAuditRow>();
    for (const row of rows) { const keys = [row.record_id, typeof row.new_data?.youtube_id === "string" ? row.new_data.youtube_id : null].filter(Boolean) as string[]; for (const key of keys) if (!latest.has(key)) latest.set(key, row); }
    return latest;
  }, [rows]);
}
function InlineActivity({ row }: { row?: InlineAuditRow }) {
  if (!row) return <p className="audit-line">Activity details appear after the next tracked change.</p>;
  const action = row.action === "INSERT" ? "Created by" : row.action === "DELETE" ? "Deleted by" : "Last updated by";
  return <p className="audit-line">{action} <b>{row.changed_by_name || "Admin"}</b> · {new Date(row.changed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST</p>;
}

export default function AdminPage() {
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  return <AdminAuth onIdentity={setIdentity}><AdminStudio identity={identity} /></AdminAuth>;
}

function AdminStudio({ identity }: { identity: AdminIdentity | null }) {
  const [active, setActive] = useState<ModuleKey>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [communityCounts, setCommunityCounts] = useState<Record<string, number>>({ Explorer: 0, Ideator: 0, "Founder’s Club": 0 });
  const [loadedShorts, setLoadedShorts] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadProductionData = async () => {
      if (!identity?.id) return;
      const session = readSession();
      if (!supabaseConfigured || !session?.access_token) return;
      try {
        const [apps, eventRows, teamRows, communityRows, shortRows] = await Promise.all([
          restSelect("applications", session.access_token, "select=id,type,full_name,email,current_stage,status,created_at,archived_at,profile_picture_url,phone,campus,degree,year,idea,problem,target_users,prototype_url,message,review_notes,payload&order=created_at.desc&limit=500"),
          restSelect("events", session.access_token, "select=*&order=starts_at.asc&limit=100"),
          restSelect("team_members", session.access_token, "select=id,name,role,campus,team,year_of_study,degree_program,email,photo_url,published&order=display_order.asc&limit=50"),
          restSelect("communities", session.access_token, "select=name,member_count&order=name.asc&limit=10"),
          restSelect("youtube_shorts", session.access_token, "select=youtube_id,published,title&order=display_order.asc&limit=30")
        ]);
        if (cancelled) return;
        if (Array.isArray(apps)) setApplications(apps.map((a:any) => ({ id:a.id, name:a.full_name, type:({campus_innovation_fellow:"Campus Innovation Fellow",social_media:"Social Media",explorer:"Explorer",ideator:"Ideator"} as Record<string,string>)[a.type] || a.type, email:a.email, stage:(({idea:"Idea stage",research:"Researching the problem",validation:"Validating with users",prototype:"Building a prototype",mvp:"MVP / early product",team_application:"Applying to join the team",event_volunteering:"Event and community work",project_execution:"Project execution",outreach:"Outreach and partnerships"} as Record<string,string>)[a.current_stage] || a.current_stage || "—"), status:({new:"New",review:"Review",accepted:"Active",active:"Active",rejected:"Draft"} as Record<string,Status>)[a.status] || "New", date:a.created_at ? new Date(a.created_at).toLocaleDateString() : "—", createdAt:a.created_at, archivedAt:a.archived_at || undefined, profilePictureUrl:a.profile_picture_url || undefined, phone:a.phone || "", campus:a.campus || "", degree:a.degree || "", year:a.year || "", idea:a.idea || "", problem:a.problem || "", targetUsers:a.target_users || "", prototypeUrl:a.prototype_url || "", message:a.message || "", reviewNotes:a.review_notes || "", payload:a.payload && typeof a.payload === "object" ? a.payload : {} })));
        if (Array.isArray(eventRows)) setEvents(eventRows.map((e:any) => ({ id:e.id, title:e.title, date:formatEventDate(e.starts_at), community:e.community || "Lab", status:e.status === "published" ? "Published" : "Draft", updatedBy:e.updated_by_name || "—", startsAt:e.starts_at || undefined, description:e.description || "", registrationUrl:e.registration_url || "", createdAt:e.created_at || undefined })));
        if (Array.isArray(teamRows)) setTeam(teamRows.map((m:any) => ({ id:m.id, name:m.name, role:m.role || undefined, campus:m.campus || "—", team:m.team || "—", yearOfStudy:m.year_of_study || undefined, degreeProgram:m.degree_program || undefined, status:m.published ? "Published" : "Draft", email:m.email || undefined, photoUrl:m.photo_url || undefined })));
        if (Array.isArray(communityRows)) setCommunityCounts(Object.fromEntries(communityRows.map((c:any) => [c.name, Number(c.member_count || 0)])));
        if (Array.isArray(shortRows)) setLoadedShorts(shortRows.map((row: any) => row.youtube_id).filter((id: unknown): id is string => typeof id === "string"));
      } catch (err) {
        console.error("Admin data load failed", err);
      }
    };
    loadProductionData();
    return () => { cancelled = true; };
  }, [identity?.id]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const activeApplications = useMemo(() => applications.filter(a => !isArchivedTeamApplication(a)), [applications]);
  const filteredApps = useMemo(() => activeApplications.filter(a => `${a.name} ${a.type} ${a.email}`.toLowerCase().includes(search.toLowerCase())), [activeApplications, search]);
  const filteredEvents = useMemo(() => events.filter(e => `${e.title} ${e.community}`.toLowerCase().includes(search.toLowerCase())), [events, search]);

  const selectModule = (key: ModuleKey) => { setActive(key); setMobileOpen(false); setSearch(""); };

  const cycleApplication = async (id: string) => {
    const current = applications.find(a => a.id === id);
    if (!current) return;
    const nextStatus = current.status === "New" ? "Review" : current.status === "Review" ? "Active" : "New";
    try {
      const raw = localStorage.getItem("iilm-admin-session");
      const session = raw ? JSON.parse(raw) : null;
      if (!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before updating applications.");
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!base || !anon) throw new Error("Admin services are temporarily unavailable.");
      const res = await fetch(`${base}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`, { method:"PATCH", headers:{apikey:anon, Authorization:`Bearer ${session.access_token}`, "Content-Type":"application/json", Prefer:"return=minimal"}, body:JSON.stringify({status: nextStatus.toLowerCase()}) });
      if (!res.ok) throw new Error("Could not update application");
      setApplications(list => list.map(a => a.id === id ? { ...a, status: nextStatus } : a));
      notify("Application status updated");
    } catch (err) { notify(err instanceof Error ? err.message : "Database update failed"); }
  };

  const cycleEvent = async (id: string) => {
    const current = events.find(e => e.id === id); if (!current) return;
    const nextStatus: Status = current.status === "Draft" ? "Published" : "Draft";
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      if (!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before updating events.");
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!base || !anon) throw new Error("Admin services are temporarily unavailable.");
      const res = await fetch(`${base}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {method:"PATCH", headers:{apikey:anon, Authorization:`Bearer ${session.access_token}`, "Content-Type":"application/json", Prefer:"return=minimal"}, body:JSON.stringify({status:nextStatus.toLowerCase()})});
      if(!res.ok) throw new Error("Could not update event");
      setEvents(list => list.map(e => e.id === id ? { ...e, status: nextStatus, updatedBy: identity?.name || "Team Member" } : e));
      void fetch("/api/admin/events/revalidate", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => undefined);
      notify("Event publishing state updated");
    } catch (err) { notify(err instanceof Error ? err.message : "Database update failed"); }
  };

  const cycleTeam = async (id: string) => {
    const current = team.find(t => t.id === id); if (!current) return;
    const published = current.status !== "Published";
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      if (!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before updating team members.");
      const res = await fetch("/api/admin/team-members", {method:"PATCH", headers:{Authorization:`Bearer ${session.access_token}`, "Content-Type":"application/json"}, body:JSON.stringify({id, published})});
      const result = await res.json().catch(() => ({}));
      if(!res.ok) throw new Error(result.error || "Could not update team member");
      setTeam(list => list.map(t => t.id === id ? { ...t, status: published ? "Published" : "Draft" } : t));
      notify("Team visibility updated");
    } catch (err) { notify(err instanceof Error ? err.message : "Database update failed"); }
  };

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">IN</div>
          <div><strong>Innovation Lab</strong><span>Admin Studio</span></div>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <small>WORKSPACE</small>
          {nav.map(item => <button key={item.key} className={active === item.key ? "is-active" : ""} onClick={() => selectModule(item.key)}><span className="admin-nav-icon">{item.icon}</span><span>{item.label}</span>{item.badge && <em>{item.key === "applications" ? activeApplications.length : item.badge}</em>}</button>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-view-site">↗ <span>View live website</span></Link>
        </div>
      </aside>

      {mobileOpen && <button className="admin-overlay" aria-label="Close admin menu" onClick={() => setMobileOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-left"><button className="admin-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation">☰</button><div><span>ADMIN STUDIO</span><h1>{nav.find(n => n.key === active)?.label}</h1></div></div>
          <div className="admin-top-actions"><label className="admin-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications & events…" /><kbd>⌘ K</kbd></label><div className="admin-user"><div>{(identity?.name || "AN").split(" ").map(x=>x[0]).join("").slice(0,2)}</div><span>{identity?.name || "Admin"}<br /><small>Admin</small></span><button className="admin-logout" onClick={() => window.dispatchEvent(new Event("iilm-admin-request-logout"))}>Log out</button></div></div>
        </header>

        <div className="admin-content">
          {active === "overview" && <Overview onSelect={selectModule} onNotify={notify} applications={activeApplications} events={events} teamCount={team.length} />}
          {active === "star-ideators" && <StarIdeators onNotify={notify} />}
          {active === "applications" && <Applications data={filteredApps} onNotify={notify} onSaved={(updated) => setApplications(list => list.map(a => a.id === updated.id ? { ...a, ...updated } : a))} onTeamAdded={(member) => setTeam(list => [member, ...list.filter(existing => existing.id !== member.id)])} />}
          {active === "events" && <Events data={filteredEvents} onCycle={cycleEvent} onNotify={notify} onAdd={(event) => setEvents(list => [event, ...list])} />}
          {active === "team" && <Team data={team} onCycle={cycleTeam} onNotify={notify} role="admin" onAdd={(member) => setTeam(list => [member, ...list.filter(existing => existing.id !== member.id)])} onDelete={(id) => setTeam(list => list.filter(member => member.id !== id))} />}
          {active === "communities" && <Communities counts={communityCounts} onCountsChange={setCommunityCounts} onNotify={notify} />}
          {active === "social" && <Social onNotify={notify} initialShorts={loadedShorts} />}
          {active === "announcements" && <Announcements onNotify={notify} />}
          {active === "settings" && <><ProfileSettings identity={identity} onNotify={notify} /><BackupSettings role="admin" onNotify={notify} /><AuditLog onNotify={notify} /></>}
        </div>
      </main>
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

type StarIdeator = { id: string; name: string; role: string; bio: string; photo_url: string; linkedin_url: string; published: boolean; display_order: number };

function StarIdeators({ onNotify }: { onNotify: (message: string) => void }) {
  const [items, setItems] = useState<StarIdeator[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const reset = () => { setEditingId(null); setShowForm(false); setName(""); setRole(""); setBio(""); setPhotoUrl(""); setLinkedinUrl(""); setPhotoFile(null); setPublished(false); };
  const session = () => { const raw = localStorage.getItem("iilm-admin-session"); return raw ? JSON.parse(raw) : null; };
  const load = async () => {
    const auth = session(); if (!auth?.access_token) { setLoading(false); return; }
    try { const rows = await restSelect("star_ideators", auth.access_token, "select=*&order=display_order.asc,created_at.desc&limit=200"); if (Array.isArray(rows)) setItems(rows as StarIdeator[]); }
    catch (e) { onNotify(e instanceof Error ? e.message : "Could not load Star Ideators. Apply the Star Ideators SQL migration first."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const edit = (item: StarIdeator) => { setEditingId(item.id); setShowForm(true); setName(item.name || ""); setRole(item.role || ""); setBio(item.bio || ""); setPhotoUrl(item.photo_url || ""); setLinkedinUrl(item.linkedin_url || ""); setPublished(Boolean(item.published)); setPhotoFile(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!name.trim()) return onNotify("Add the ideator's name first.");
    setSaving(true);
    try {
      const auth = session(); if (!auth?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
      let finalPhoto = photoUrl.trim();
      if (photoFile) finalPhoto = await uploadImageDirectToCloudinary(photoFile, "star-ideators", auth.access_token);
      const payload = { name: name.trim(), role: role.trim() || null, bio: bio.trim() || null, photo_url: finalPhoto || null, linkedin_url: linkedinUrl.trim() || null, published, display_order: editingId ? (items.find(x => x.id === editingId)?.display_order ?? items.length) : items.length };
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!base || !anon) throw new Error("Supabase is not configured.");
      const response = await fetch(`${base}/rest/v1/star_ideators${editingId ? `?id=eq.${encodeURIComponent(editingId)}` : ""}`, { method: editingId ? "PATCH" : "POST", headers: { apikey: anon, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => []); if (!response.ok) throw new Error(result?.message || result?.hint || "Could not save Star Ideator.");
      onNotify(editingId ? "Star Ideator updated." : "Star Ideator added."); reset(); await load();
    } catch (e) { onNotify(e instanceof Error ? e.message : "Could not save Star Ideator."); } finally { setSaving(false); }
  };
  const togglePublish = async (item: StarIdeator) => {
    try { const auth = session(); const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!auth?.access_token || !base || !anon) throw new Error("Please sign in again."); const response = await fetch(`${base}/rest/v1/star_ideators?id=eq.${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { apikey: anon, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ published: !item.published }) }); if (!response.ok) throw new Error("Could not update publication status."); setItems(rows => rows.map(row => row.id === item.id ? { ...row, published: !row.published } : row)); onNotify(item.published ? "Star Ideator unpublished." : "Star Ideator published."); }
    catch (e) { onNotify(e instanceof Error ? e.message : "Could not update profile."); }
  };
  const remove = async (item: StarIdeator) => {
    if (!window.confirm(`Delete Star Ideator profile for ${item.name}? This cannot be undone.`)) return;
    try { const auth = session(); const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!auth?.access_token || !base || !anon) throw new Error("Please sign in again."); const response = await fetch(`${base}/rest/v1/star_ideators?id=eq.${encodeURIComponent(item.id)}`, { method: "DELETE", headers: { apikey: anon, Authorization: `Bearer ${auth.access_token}` } }); if (!response.ok) throw new Error("Could not delete profile."); setItems(rows => rows.filter(row => row.id !== item.id)); onNotify("Star Ideator deleted."); }
    catch (e) { onNotify(e instanceof Error ? e.message : "Could not delete profile."); }
  };
  return <><PageIntro eyebrow="IDEAS AND PEOPLE TO WATCH" title="Star Ideators" description="Feature student ideators and their ideas on the public Innovation Lab website." action={showForm ? undefined : "Add Star Ideator"} onAction={() => { reset(); setShowForm(true); }} />
    {showForm && <section className="admin-card composer-card"><div className="admin-card-head"><div><span>{editingId ? "EDIT PROFILE" : "NEW PROFILE"}</span><h3>{editingId ? "Update Star Ideator." : "Add a Star Ideator."}</h3><p>Only published profiles appear on the public website.</p></div><button type="button" className="admin-secondary" onClick={reset}>Close</button></div><form onSubmit={save}><div className="composer-grid two-col"><label className="composer-field"><span>Full name <em>Required</em></span><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Student's full name" /></label><label className="composer-field"><span>Role / idea title</span><input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Founder · Campus navigation" /></label><label className="composer-field field-full"><span>Short bio / idea description</span><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} placeholder="What are they exploring or building?" /></label><label className="composer-field field-full"><span>Profile image URL <small>Optional · Cloudinary URL</small></span><input type="url" value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://res.cloudinary.com/..." /></label><label className="composer-field field-full"><span>Upload image <small>Optional · JPG, PNG or WebP · max 5 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{ const file=e.target.files?.[0]||null; if(file && file.size>5*1024*1024){onNotify("Image must be 5 MB or smaller.");e.target.value="";return;} setPhotoFile(file); }} /></label><label className="composer-field field-full"><span>LinkedIn URL <small>Optional</small></span><input type="url" value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." /></label><label className="composer-field field-full" style={{display:"flex",alignItems:"center",gap:10}}><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)} style={{width:18,height:18}} /> Publish this profile on the main website</label></div><div className="composer-actions"><button type="button" className="admin-secondary" onClick={reset}>Cancel</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes ↗" : "Add Star Ideator ↗"}</button></div></form></section>}
    {loading ? <section className="admin-card"><p>Loading Star Ideators…</p></section> : <section className="admin-card"><div className="admin-card-head"><div><span>PROFILE DIRECTORY</span><h3>{items.length} {items.length===1?"profile":"profiles"}</h3></div></div>{items.length ? <div className="team-admin-grid star-ideator-grid">{items.map(item=><article className="team-admin-card" key={item.id}><div className="team-avatar-admin">{item.photo_url ? <img src={optimizedCloudinaryImageUrl(item.photo_url,480)} alt="" loading="lazy" width={480} height={480}/> : item.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><h3>{item.name}</h3><p>{item.role || "Star Ideator"}</p><small>{item.bio || "No bio added yet."}</small><footer><Badge status={item.published ? "Published" : "Draft"}/><button onClick={()=>edit(item)}>Edit</button><button onClick={()=>void togglePublish(item)}>{item.published ? "Unpublish" : "Publish"}</button><button onClick={()=>void remove(item)}>Delete</button></footer></article>)}</div> : <p className="admin-empty">No Star Ideators yet. Add a profile to get started.</p>}</section>}
    <style jsx>{`.star-ideator-grid{margin-top:12px}.star-ideator-grid .team-admin-card footer{flex-wrap:wrap;gap:8px}.star-ideator-grid .team-admin-card small{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}`}</style>
  </>;
}

function ProfileSettings({ identity, onNotify }: { identity: AdminIdentity | null; onNotify: (message: string) => void }) {
  const [fullName, setFullName] = useState(identity?.name || "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setFullName(identity?.name || ""); }, [identity?.name]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = fullName.trim();
    if (name.length < 2 || name.length > 120) { onNotify("Enter a name between 2 and 120 characters."); return; }
    const session = readSession();
    if (!session?.access_token) { onNotify("Your session has expired. Please sign in again."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ full_name: name }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update your display name.");
      window.dispatchEvent(new CustomEvent("iilm-admin-profile-updated", { detail: { full_name: name } }));
      onNotify("Your display name was updated.");
    } catch (error) { onNotify(error instanceof Error ? error.message : "Could not update your display name."); }
    finally { setSaving(false); }
  };
  return <>
    <PageIntro eyebrow="YOUR ACCOUNT" title="Profile" description="Choose the name that appears in the admin workspace and activity history. Your account identity and role are managed securely." />
    <section className="admin-card" style={{ maxWidth: 760, marginBottom: 24 }}>
      <div className="admin-card-head"><div><span>ADMIN PROFILE</span><h3>Display name</h3></div></div>
      <form onSubmit={save} style={{ display: "grid", gap: 14, padding: "0 22px 22px" }}>
        <label style={{ display: "grid", gap: 7 }}><span style={{ fontWeight: 600 }}>Full name</span><input value={fullName} onChange={event => setFullName(event.target.value)} maxLength={120} required placeholder="Enter your full name" style={{ border: "1px solid #d8dce3", borderRadius: 10, padding: "12px 14px", width: "100%" }} /></label>
        <label style={{ display: "grid", gap: 7 }}><span style={{ fontWeight: 600 }}>Account email</span><input value={identity?.email || ""} readOnly style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", width: "100%", background: "#f8fafc" }} /></label>
        <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>Role: Admin. Role and account authorization cannot be changed from this form.</p>
        <div><button className="admin-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save display name"}</button></div>
      </form>
    </section>
  </>;
}

type AuditEntry = { id: number; table_name: string; record_id: string | null; action: string; changed_by_name: string; changed_at: string; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null };

function AuditLog({ onNotify }: { onNotify: (message: string) => void }) {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
        if (!session?.access_token) throw new Error("Sign in to view activity history.");
        const result = await restSelect("audit_logs", session.access_token, `select=id,table_name,record_id,action,changed_by_name,changed_at,old_data,new_data&changed_at=gte.${encodeURIComponent(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString())}&order=changed_at.desc&limit=100`);
        if (!Array.isArray(result)) throw new Error("Could not load activity history. Please contact the site administrator.");
        if (active) setRows(result as AuditEntry[]);
      } catch (error) { onNotify(error instanceof Error ? error.message : "Could not load activity history"); }
      finally { if (active) setLoading(false); }
    };
    void load(); return () => { active = false; };
  }, []);
  const visible = rows.filter(row => filter === "all" || row.table_name === filter);
  const changedFields = (row: AuditEntry) => {
    const before = row.old_data || {}; const after = row.new_data || {};
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !["updated_at","updated_by","updated_by_name","created_at","created_by","created_by_name"].includes(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]));
    if (row.action === "INSERT") return Object.keys(after).filter(key => !["created_at","updated_at","created_by","created_by_name","updated_by","updated_by_name"].includes(key)).slice(0, 8).join(", ") || "New record created";
    if (row.action === "DELETE") return "Record deleted";
    return keys.slice(0, 8).join(", ") || "Record updated";
  };
  const valueLabel = (value: unknown) => { if (value === undefined) return "—"; if (value === null || value === "") return "(empty)"; const text = typeof value === "string" ? value : JSON.stringify(value); return text.length > 180 ? `${text.slice(0, 180)}…` : text; };
  const diffKeys = (row: AuditEntry) => { const before = row.old_data || {}; const after = row.new_data || {}; return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !["updated_at","updated_by","updated_by_name","created_at","created_by","created_by_name"].includes(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key])).slice(0, 12); };
  return <>
    <PageIntro eyebrow="ACCOUNTABILITY" title="Activity log" description="See who changed what, and exactly when. Entries are written by database triggers for tracked records." />
    <section className="admin-card" style={{ overflowX: "auto" }}>
      <div className="admin-card-head"><div><span>RECENT CHANGES</span><h3>{visible.length} activity records</h3></div><select aria-label="Filter activity log" value={filter} onChange={event => setFilter(event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d8dce3", background: "white" }}><option value="all">All modules</option>{["events","communities","youtube_shorts","announcements","applications","team_members","profiles"].map(name => <option key={name} value={name}>{name.replaceAll("_", " ")}</option>)}</select></div>
      {loading ? <p>Loading activity…</p> : visible.length === 0 ? <p>No activity has been recorded yet. Changes made after the audit migration will appear here.</p> : <div className="admin-table" style={{ minWidth: 760 }}><div className="admin-table-row admin-table-head" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr" }}><span>Who</span><span>Action</span><span>Module</span><span>What changed</span><span>Date & time</span></div>{visible.map(row => <div className="admin-table-row" key={row.id} style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr", alignItems: "start" }}><span><b>{row.changed_by_name || "System"}</b><small style={{ display: "block", color: "#6b7280" }}>Record {row.record_id || "—"}</small></span><span><Badge status={row.action === "DELETE" ? "Draft" : row.action === "INSERT" ? "Active" : "Review"} /></span><span>{row.table_name.replaceAll("_", " ")}</span><span style={{ overflowWrap: "anywhere" }}>{changedFields(row)}{row.action !== "DELETE" && <details style={{ marginTop: 6 }}><summary style={{ cursor: "pointer", color: "#5b6472" }}>View values</summary><div style={{ marginTop: 6, fontSize: 12 }}>{diffKeys(row).map(key => <div key={key} style={{ padding: "5px 0", borderBottom: "1px solid #edf0f3" }}><b>{key.replaceAll("_", " ")}</b><div><span style={{ color: "#9a3412" }}>Before:</span> {valueLabel(row.old_data?.[key])}</div><div><span style={{ color: "#166534" }}>After:</span> {valueLabel(row.new_data?.[key])}</div></div>)}</div></details>}</span><span>{new Date(row.changed_at).toLocaleString()}</span></div>)}</div>}
    </section>
  </>;
}

type AdminAccount = { id: string; email: string | null; full_name: string | null; role: string; created_at: string };
function PageIntro({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="admin-page-intro"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action && <button className="admin-primary" onClick={onAction}>＋ {action}</button>}</div>;
}

function Overview({ onSelect, onNotify, applications, events, teamCount }: { onSelect: (key: ModuleKey) => void; onNotify: (s: string) => void; applications: Application[]; events: EventItem[]; teamCount: number }) {
  return <>
    <PageIntro eyebrow="GOOD MORNING, BUILDER" title="Make the Lab move." description="One calm command center for applications, events, people, stories and everything that keeps the Innovation Lab alive." />
    <div className="admin-stats"><StatCard label="New applications" value={String(applications.filter(a => a.status === "New").length)} delta="Needs attention" tone="red" /><StatCard label="Published events" value={String(events.filter(e => e.status === "Published").length)} delta="Currently published" /><StatCard label="Team members" value={String(teamCount)} delta="Published + draft" tone="gold" /></div>
    <div className="admin-grid-two">
      <section className="admin-card admin-chart"><div className="admin-card-head"><div><span>APPLICATION PIPELINE</span><h3>Know what needs attention.</h3></div><button onClick={() => onSelect("applications")}>View applications ↗</button></div><div className="pipeline-list">{["New","Review","Active"].map(status => { const count=applications.filter(a=>a.status===status).length; const total=Math.max(applications.length,1); return <div className="pipeline-row" key={status}><span>{status}</span><div><i style={{width:`${Math.max(6,(count/total)*100)}%`}} /></div><b>{count}</b></div>; })}</div></section>
      <section className="admin-card admin-command"><div className="admin-card-head"><div><span>QUICK ACTIONS</span><h3>Do the useful thing.</h3></div><span className="spark">✦</span></div><button onClick={() => onSelect("applications")}><b>01</b><span>Review applications</span><i>→</i></button><button onClick={() => onSelect("events")}><b>02</b><span>Publish an event</span><i>→</i></button><button onClick={() => onSelect("team")}><b>03</b><span>Update the team</span><i>→</i></button><button onClick={() => onSelect("social")}><b>04</b><span>Refresh social content</span><i>→</i></button></section>
    </div>
    <section className="admin-card admin-upcoming">
      <div className="admin-card-head"><div><span>CALENDAR / UPCOMING</span><h3>What’s happening next.</h3></div><button onClick={() => onSelect("events")}>Open full calendar →</button></div>
      <div className="admin-calendar-wrap">
        <Calendar events={events} onNotify={onNotify} />
        <div className="upcoming-list">
          {events.filter(e => e.status === "Published").slice(0, 4).map((e, i) => <button className="upcoming-event" key={e.id} onClick={() => onNotify(`${e.title} selected`)}><span className={`upcoming-dot dot-${i + 1}`} /><div><strong>{e.title}</strong><small>{e.date} · {e.community}</small></div><b>→</b></button>)}
        </div>
      </div>
    </section>
    <section className="admin-card"><div className="admin-card-head"><div><span>UP NEXT</span><h3>Recent applications</h3></div><button onClick={() => onSelect("applications")}>See all →</button></div><div className="admin-table"><div className="admin-table-row admin-table-head"><span>Applicant</span><span>Community</span><span>Stage</span><span>Status</span><span>Date</span></div>{applications.slice(0, 4).map(a => <div className="admin-table-row" key={a.id}><span className="person-cell"><i>{a.name.split(" ").map(x => x[0]).join("")}</i><b>{a.name}<small>{a.email}</small></b></span><span>{a.type}</span><span>{a.stage}</span><span><Badge status={a.status} /></span><span>{a.date}</span></div>)}</div></section>
  </>;
}

function Applications({ data, onNotify, onSaved, onTeamAdded }: { data: Application[]; onNotify: (s: string) => void; onSaved: (updated: Partial<Application> & { id: string }) => void; onTeamAdded: (member: TeamMember) => void }) {
  const activityByRecord = useInlineAudit("applications");
  const [tab, setTab] = useState<"Explorer" | "Ideator" | "Team">("Explorer");
  const [teamTab, setTeamTab] = useState<"CIF" | "Social Media">("CIF");
  const [selected, setSelected] = useState<Application | null>(null);
  const [status, setStatus] = useState("new");
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingToTeam, setAddingToTeam] = useState(false);
  const community = data.filter(a => a.type === tab);
  const team = data.filter(a => a.type === (teamTab === "CIF" ? "Campus Innovation Fellow" : "Social Media"));
  const shown = tab === "Team" ? team : community;
  const openDetails = (a: Application) => { setSelected(a); setStatus(({New:"new",Review:"review",Active:"active",Draft:"rejected",Published:"active"} as Record<string,string>)[a.status] || "new"); setStage(a.stage === "—" ? "" : a.stage); setMessage(a.message || ""); setReviewNotes(a.reviewNotes || ""); };
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseConfigured || !session?.access_token || !base || !anon) throw new Error("Please sign in again before editing applications.");
      const patch: Record<string,string> = { status, current_stage: stage.trim(), review_notes: reviewNotes.trim() };
      const res = await fetch(`${base}/rest/v1/applications?id=eq.${encodeURIComponent(selected.id)}`, { method:"PATCH", headers:{apikey:anon, Authorization:`Bearer ${session.access_token}`, "Content-Type":"application/json", Prefer:"return=minimal"}, body:JSON.stringify(patch) });
      if (!res.ok) throw new Error("Could not save application changes. Please check your access and try again.");
      const statusLabel: Status = ({new:"New",review:"Review",accepted:"Active",active:"Active",rejected:"Draft"} as Record<string,Status>)[status] || "New";
      onSaved({ id:selected.id, status:statusLabel, stage:stage.trim() || "—", reviewNotes:reviewNotes.trim() });
      setSelected({...selected, status:statusLabel, stage:stage.trim() || "—", reviewNotes:reviewNotes.trim()});
      onNotify("Application details saved");
    } catch (e) { onNotify(e instanceof Error ? e.message : "Could not save application"); }
    finally { setSaving(false); }
  };
  const addToTeam = async () => {
    if (!selected || !(selected.type === "Campus Innovation Fellow" || selected.type === "Social Media")) return;
    setAddingToTeam(true);
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      if (!session?.access_token) throw new Error("Sign in again before adding a team member.");
      const response = await fetch("/api/admin/team-members", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ application_id: selected.id }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || !result.member?.id) throw new Error(result.error || "Could not add this applicant to the team.");
      const createdMember: TeamMember = {
        id: String(result.member.id), name: String(result.member.name || selected.name), role: result.member.role || undefined,
        campus: result.member.campus || selected.campus || "Greater Noida", team: result.member.team || selected.type,
        status: result.member.published === false ? "Draft" : "Published", email: result.member.email || selected.email,
        photoUrl: result.member.photo_url || selected.profilePictureUrl || undefined,
      };
      onTeamAdded(createdMember);
      onSaved({ id: selected.id, status: "Active", stage: "Added to team", archivedAt: new Date().toISOString() });
      onNotify(result.alreadyOnTeam ? "This student was already on the team; the application has been archived." : "Applicant added to Team. The application has been archived and removed from the active list.");
      setSelected(null);
    } catch (e) { onNotify(e instanceof Error ? e.message : "Could not add applicant to team"); }
    finally { setAddingToTeam(false); }
  };
  const humanizeKey = (key: string) => {
    const known: Record<string, string> = {
      class_section: "Class section", source: "How did you hear about the Lab?", validation: "What have you done to validate the problem so far?",
      relevant_experience: "Relevant experience, activities or skills", contribution: "What would you do to help students engage with innovation?",
      roles: "Role(s) interested in", humour: "How would you add humour to the entrepreneurship reel?", work: "Work samples / portfolio links",
      linkedin: "LinkedIn profile", submitted_stage: "Applicant’s selected stage", section: "Class section", motivation: "Why do you want to join?", about: "About", about_you: "About you", creative_weapon: "Creative weapon / selected role", how_does_he_think: "How does he think?", what_would_you_share: "What would you share?",
      experience: "Relevant experience", idea: "Describe your idea", problem: "Problem you want to solve", target_users: "Who experiences this problem?",
    };
    if (known[key]) return known[key];
    return key.replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };
  const displayValue = (value: unknown): string => {
    if (value == null || value === "") return "Not provided";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(item => displayValue(item)).filter(item => item !== "Not provided").join(", ") || "Not provided";
    if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${humanizeKey(key)}: ${displayValue(item)}`).join("\n");
    return String(value);
  };
  const displayStage = (value: unknown): string => {
    if (typeof value !== "string" || !value) return displayValue(value);
    const labels: Record<string, string> = {
      idea: "Idea stage", research: "Researching the problem", validation: "Validating with users", prototype: "Building a prototype", mvp: "MVP / early product",
      team_application: "Applying to join the team", event_volunteering: "Event and community work", project_execution: "Project execution", outreach: "Outreach and partnerships",
    };
    return labels[value] || value;
  };
  const payloadLabel = (key: string, type: string) => {
    if (type === "Social Media") {
      if (key === "idea") return "You have ₹0, one Instagram account and 7 days to make students across IILM notice the Innovation Lab. What would you do?";
      if (key === "humour") return "You’re asked to make a reel about “Entrepreneurship at IILM.” How would you add humour so students actually want to watch and share it?";
    }
    if (type === "Explorer" && key === "message") return "Why do you want to pursue entrepreneurship?";
    if (type === "Ideator" && key === "message") return "Motivation / additional context";
    if (type === "Campus Innovation Fellow" && key === "message") return "Why do you want to become a Campus Innovation Fellow?";
    return humanizeKey(key);
  };
  return <><PageIntro eyebrow="PEOPLE → OPPORTUNITY" title="Applications" description="Open any application to review the full submission, update its status and stage, and manage team onboarding." />
    <div className="admin-tabs application-tabs" role="tablist" aria-label="Application type">
      <button role="tab" aria-selected={tab === "Explorer"} className={tab==="Explorer"?"is-active":""} onClick={()=>setTab("Explorer")}>Explorer <b>{data.filter(a=>a.type==="Explorer").length}</b></button>
      <button role="tab" aria-selected={tab === "Ideator"} className={tab==="Ideator"?"is-active":""} onClick={()=>setTab("Ideator")}>Ideator <b>{data.filter(a=>a.type==="Ideator").length}</b></button>
      <button role="tab" aria-selected={tab === "Team"} className={tab==="Team"?"is-active":""} onClick={()=>setTab("Team")}>Team applications <b>{data.filter(a=>a.type==="Campus Innovation Fellow"||a.type==="Social Media").length}</b></button>
    </div>
    {tab === "Team" && <div className="application-team-switcher" role="tablist" aria-label="Team application type"><span>TEAM APPLICATIONS</span><div className="application-switcher-track"><button role="tab" aria-selected={teamTab === "CIF"} className={teamTab==="CIF"?"is-active":""} onClick={()=>setTeamTab("CIF")}>Campus Innovation Fellow <b>{data.filter(a=>a.type==="Campus Innovation Fellow").length}</b></button><button role="tab" aria-selected={teamTab === "Social Media"} className={teamTab==="Social Media"?"is-active":""} onClick={()=>setTeamTab("Social Media")}>Social Media Team <b>{data.filter(a=>a.type==="Social Media").length}</b></button></div></div>}
    <section className="admin-card"><div className="admin-table admin-table-wide"><div className="admin-table-row admin-table-head"><span>Applicant</span><span>Type</span><span>Stage</span><span>Status</span><span>Received</span></div>{shown.map(a => <button type="button" className="admin-table-row application-row-button" key={a.id} onClick={()=>openDetails(a)} aria-label={`Open application details for ${a.name}`}><span className="person-cell"><i>{a.name.split(" ").map(x => x[0]).join("")}</i><b>{a.name}<small>{a.email}</small></b></span><span data-label="Type">{a.type}</span><span data-label="Stage">{a.stage}</span><span data-label="Status"><Badge status={a.status} /></span><span data-label="Received">{a.date}</span></button>)}</div>{shown.length===0 && <p className="admin-empty">No applications in this tab yet.</p>}</section>
    {selected && <div className="application-detail-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="application-detail-panel" role="dialog" aria-modal="true" aria-labelledby="application-detail-title"><header className="application-detail-header"><div><span>APPLICATION REVIEW · {selected.type.toUpperCase()}</span><h2 id="application-detail-title">{selected.name}</h2><p>Received {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : selected.date}</p></div><button type="button" className="composer-close" onClick={()=>setSelected(null)} aria-label="Close application details">✕</button></header>
      <div className="application-detail-content"><div className="application-detail-main">{selected.profilePictureUrl && <section className="application-detail-section"><h3>Profile picture</h3><div className="application-submitted-photo"><img src={optimizedCloudinaryImageUrl(selected.profilePictureUrl, 480)} alt={`${selected.name} profile`} loading="lazy" decoding="async" width={480} height={480} /><a href={selected.profilePictureUrl} target="_blank" rel="noreferrer">Open original image ↗</a></div></section>}{selected.type === "Social Media" ? <>
        <section className="application-detail-section"><h3>01 · Who are we talking to?</h3><div className="application-detail-grid">{[["Full name",selected.name],["Email address",selected.email],["WhatsApp number",selected.phone],["Year of study",selected.year],["Degree / Program",selected.degree],["Campus",selected.campus],["Application type",selected.type]].map(([label,value])=><div className="application-detail-field" key={label}><span>{label}</span><strong>{value || "Not provided"}</strong></div>)}</div></section>
        <section className="application-detail-section"><h3>02 · Your role — pick your creative weapon</h3><div className="application-answer"><span>Role(s) interested in</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(selected.payload?.roles ?? selected.payload?.creative_weapon ?? selected.payload?.role)}</p></div></section>
        <section className="application-detail-section"><h3>03 · The ₹0 challenge — show us how you think</h3><div className="application-answer"><span>You have ₹0, one Instagram account and 7 days to make students across IILM notice the Innovation Lab. What would you do?</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(selected.message || selected.idea || selected.payload?.idea)}</p></div></section>
        <section className="application-detail-section"><h3>04 · Make it funny — would students actually share it?</h3><div className="application-answer"><span>You’re asked to make a reel about “Entrepreneurship at IILM.” How would you add humour so students actually want to watch and share it?</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(selected.payload?.humour ?? selected.payload?.how_does_he_think ?? selected.payload?.what_would_you_share)}</p></div></section>
        <section className="application-detail-section"><h3>05 · Show your work — drop the receipts</h3><div className="application-answer"><span>Work samples / portfolio links</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(selected.payload?.work ?? selected.payload?.receipts ?? selected.prototypeUrl)}</p></div><div className="application-answer"><span>LinkedIn profile</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(selected.payload?.linkedin)}</p></div></section>
        {selected.payload && Object.entries(selected.payload).filter(([key]) => !["submitted_stage","roles","creative_weapon","role","idea","humour","how_does_he_think","what_would_you_share","work","receipts","linkedin"].includes(key)).length > 0 && <section className="application-detail-section"><h3>Other submitted answers</h3>{Object.entries(selected.payload).filter(([key]) => !["submitted_stage","roles","creative_weapon","role","idea","humour","how_does_he_think","what_would_you_share","work","receipts","linkedin"].includes(key)).map(([key,value])=><div className="application-answer" key={key}><span>{payloadLabel(key, selected.type)}</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(value)}</p></div>)}</section>}
      </> : <><section className="application-detail-section"><h3>Applicant details</h3><div className="application-detail-grid">{[["Email",selected.email],["Phone",selected.phone],["Campus",selected.campus],["Degree / Program",selected.degree],["Year",selected.year],["Submitted stage", displayStage(selected.payload?.submitted_stage ?? selected.stage)],["Application type",selected.type]].map(([label,value])=><div className="application-detail-field" key={label}><span>{label}</span><strong>{value || "Not provided"}</strong></div>)}</div>{selected.prototypeUrl && <p className="application-link-field"><span>Prototype / portfolio</span><a href={selected.prototypeUrl} target="_blank" rel="noreferrer">{selected.prototypeUrl} ↗</a></p>}</section>
      {(selected.idea || selected.problem || selected.targetUsers || selected.message) && <section className="application-detail-section"><h3>Submission</h3>{[["Idea",selected.idea],["Problem",selected.problem],["Target users",selected.targetUsers],[selected.type === "Explorer" ? "Why do you want to pursue entrepreneurship?" : selected.type === "Campus Innovation Fellow" ? "Why do you want to become a Campus Innovation Fellow?" : "Additional message / motivation",selected.message]].filter(([,value])=>Boolean(value)).map(([label,value])=><div className="application-answer" key={label}><span>{label}</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{String(value)}</p></div>)}</section>}
      {selected.payload && Object.keys(selected.payload).length>0 && <section className="application-detail-section"><h3>Additional answers</h3>{Object.entries(selected.payload).filter(([key]) => key !== "submitted_stage").map(([key,value])=><div className="application-answer" key={key}><span>{payloadLabel(key, selected.type)}</span><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{displayValue(value)}</p></div>)}</section>}</>}</div>
      <aside className="application-detail-sidebar"><section className="application-detail-section"><h3>Review controls</h3><label className="composer-field"><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="new">New</option><option value="review">In review</option><option value="accepted">Accepted</option><option value="active">Active</option><option value="rejected">Rejected</option></select></label><label className="composer-field"><span>Stage / internal label</span><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="e.g. Interview scheduled" /></label><div className="application-original-message"><span>Applicant message</span><p>{message || "No message provided."}</p></div><label className="composer-field"><span>Internal review notes</span><textarea value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} placeholder="Private notes for reviewers and follow-up" rows={5}/></label><button type="button" className="admin-primary" disabled={saving} onClick={()=>void save()}>{saving?"Saving…":"Save changes"}</button></section>
      {(selected.type === "Campus Innovation Fellow" || selected.type === "Social Media") && <section className="application-detail-section"><h3>Team onboarding</h3><p className="application-onboarding-note">Add this student to the public team roster and archive the application. No sign-in account or credentials are created here.</p><button type="button" className="admin-primary" disabled={addingToTeam} onClick={()=>void addToTeam()}>{addingToTeam?"Adding to team…":"Add to team & archive ↗"}</button></section>}
      <section className="application-detail-section application-audit-note"><h3>Record</h3><span>Application ID</span><code>{selected.id}</code><span>Created</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : selected.date}</strong><InlineActivity row={activityByRecord.get(String(selected.id))} /></section></aside></div></section></div>}
  </>;
}

function formatEventDate(value?: string | null) {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  const dateLabel = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime ? `${dateLabel} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : dateLabel;
}

function Events({ data, onCycle, onNotify, onAdd }: { data: EventItem[]; onCycle: (id: string) => void; onNotify: (s: string) => void; onAdd: (event: EventItem) => void }) {
  const activityByRecord = useInlineAudit("events");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [community, setCommunity] = useState("Explorer"); const [registration, setRegistration] = useState(""); const [description, setDescription] = useState(""); const [saving, setSaving] = useState(false); const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const create = async () => {
    if (!title.trim() || !date.trim()) return onNotify("Add an event title and date first");
    const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return onNotify("Choose a valid date from the calendar");
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
    const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
    const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) return onNotify("Enter a valid calendar date in DD-MM-YY format");
    const startsAt = localDate.toISOString();
    setSaving(true);
    try {
      const raw = localStorage.getItem("iilm-admin-session");
      const session = raw ? JSON.parse(raw) : null;
      if (!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before creating events.");
      const rows = await restInsert("events", session.access_token, { title:title.trim(), description:description.trim() || null, starts_at:startsAt, community, registration_url:registration.trim() || null, status:"published" });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.id) throw new Error("The event was not returned by the database. Please check your permissions.");
      const created: EventItem = { id:row.id, title:row.title || title.trim(), date:formatEventDate(row.starts_at || startsAt), community:row.community || community, status:row.status === "published" ? "Published" : "Draft", startsAt:row.starts_at || startsAt, updatedBy:row?.updated_by_name || session?.identity?.name || "Admin", description:description.trim(), registrationUrl:registration.trim() || "", createdAt:row.created_at || new Date().toISOString() };
      onAdd(created); setShowForm(false); setTitle(""); setDate(""); setTime(""); setRegistration(""); setDescription("");
      void fetch("/api/admin/events/revalidate", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => undefined);
      onNotify("Event published");
    } catch (err) { onNotify(err instanceof Error ? err.message : "Could not create event"); } finally { setSaving(false); }
  };
  const deleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event permanently? This cannot be undone.")) return;
    try { const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null; const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!session?.access_token || !base || !anon) throw new Error("Please sign in again before deleting events."); const res = await fetch(`${base}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method:"DELETE", headers:{apikey:anon,Authorization:`Bearer ${session.access_token}`,Prefer:"return=minimal"} }); if (!res.ok) throw new Error("Could not delete event. Check your admin permissions."); setSelectedEvent(null); onNotify("Event deleted"); window.location.reload(); } catch(err) { onNotify(err instanceof Error ? err.message : "Could not delete event"); }
  };
  return <><PageIntro eyebrow="PROGRAMMING + CALENDAR" title="Events" description="See the month at a glance, keep upcoming sessions visible, and publish when ready." action="New event" onAction={() => setShowForm(true)} />
    {showForm && <section className="admin-card composer-card event-composer">
      <div className="admin-card-head composer-head"><div><span>NEW EVENT</span><h3>Build the session details.</h3><p>Give students the essentials first. You can add the registration link if one exists.</p></div><button className="composer-close" onClick={()=>setShowForm(false)}>Close</button></div>
      <div className="composer-layout event-composer-layout">
        <div className="composer-main">
          <div className="composer-section-label"><span>01</span><div><b>Event basics</b><small>Name the session and place it in the right community.</small></div></div>
          <div className="composer-grid two-col">
            <label className="composer-field"><span>Title <em>Required</em></span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Founder session" /></label>
            <label className="composer-field"><span>Date <em>Required</em></span><input type="date" value={date} onChange={e=>setDate(e.target.value)} required aria-label="Event date" /></label>
            <label className="composer-field"><span>Time <small>Optional</small></span><input type="time" value={time} onChange={e=>setTime(e.target.value)} aria-label="Optional event time" /></label>
            <label className="composer-field"><span>Community</span><select value={community} onChange={e=>setCommunity(e.target.value)}><option>Explorer</option><option>Ideator</option><option>Founder’s Club</option><option>Lab-wide</option></select></label>
            <label className="composer-field"><span>Registration URL <small>Optional</small></span><input value={registration} onChange={e=>setRegistration(e.target.value)} placeholder="https://forms.google.com/..." /></label>
            <label className="composer-field field-full"><span>Description <small>Keep it short and useful</small></span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should students know before they join?" /></label>
          </div>
          <div className="composer-actions"><button className="admin-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="admin-primary" disabled={saving} onClick={create}>{saving?"Publishing…":"Publish event ↗"}</button></div>
        </div>
        <aside className="composer-preview event-preview">
          <div className="preview-kicker"><span>LIVE PREVIEW</span><b>{community}</b></div>
          <div className="event-preview-date">{date.trim() || "Choose date"}<span>{time ? new Date(`2000-01-01T${time}`).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}) : "Time not specified"}</span></div>
          <h4>{title.trim() || "Your event title"}</h4>
          <p>{description.trim() || "A clear, useful event description will appear here for the team to review."}</p>
          <div className="preview-meta"><span>{registration.trim() ? "Registration link added" : "No registration link yet"}</span><i>↗</i></div>
        </aside>
      </div>
    </section>}
    <section className="admin-card admin-events-calendar"><div className="admin-card-head"><div><span>CALENDAR / UPCOMING</span><h3>Plan the month.</h3></div><span className="calendar-live"><i /> Cached public schedule</span></div><div className="admin-calendar-large"><Calendar events={data} onNotify={onNotify} large /><div className="calendar-side-list"><span>UPCOMING EVENTS</span>{data.map(e => <button className="upcoming-event" key={e.id} onClick={() => onNotify(`${e.title} selected`)}><span className="upcoming-dot" /><div><strong>{e.title}</strong><small>{e.date} · {e.community}</small></div><Badge status={e.status} /></button>)}</div></div></section>
    <div className="event-grid">{data.map((e, i) => <article className="event-card-admin" key={e.id}><div className={`event-art art-${i + 1}`}><span>{e.community}</span><strong>{String(i + 1).padStart(2, "0")}</strong></div><div className="event-card-body"><small>{e.date}</small><h3>{e.title}</h3><InlineActivity row={activityByRecord.get(String(e.id))} /><div><Badge status={e.status} /><button onClick={() => onCycle(e.id)}>Toggle status</button><button onClick={() => setSelectedEvent(e)}>View details</button><button onClick={() => void deleteEvent(e.id)}>Delete</button></div></div></article>)}</div>
    {selectedEvent && <div className="announcement-detail-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedEvent(null); }}><section className="admin-card announcement-detail-panel" role="dialog" aria-modal="true"><div className="admin-card-head"><div><span>EVENT DETAILS</span><h3>{selectedEvent.title}</h3></div><button className="admin-secondary" onClick={() => setSelectedEvent(null)}>Close ✕</button></div><div className="announcement-detail-content"><div className="announcement-detail-field"><span>TITLE</span><h4>{selectedEvent.title}</h4></div><div className="announcement-detail-field"><span>DATE & TIME</span><p>{selectedEvent.startsAt ? new Date(selectedEvent.startsAt).toLocaleString("en-IN", {dateStyle:"full",timeStyle:"short",timeZone:"Asia/Kolkata"}) + " IST" : selectedEvent.date}</p></div><div className="announcement-detail-field"><span>COMMUNITY</span><p>{selectedEvent.community}</p></div><div className="announcement-detail-field"><span>STATUS</span><p>{selectedEvent.status}</p></div><div className="announcement-detail-field"><span>DESCRIPTION</span><p>{selectedEvent.description || "No description saved."}</p></div><div className="announcement-detail-field"><span>REGISTRATION LINK</span>{selectedEvent.registrationUrl ? <a href={selectedEvent.registrationUrl} target="_blank" rel="noreferrer">{selectedEvent.registrationUrl} ↗</a> : <p>Not configured</p>}</div></div><div className="announcement-detail-footer"><div><InlineActivity row={activityByRecord.get(String(selectedEvent.id))} /><p className="audit-line">Created at {selectedEvent.createdAt ? new Date(selectedEvent.createdAt).toLocaleString("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}) + " IST" : "Unavailable"}</p></div><button className="admin-primary" onClick={() => setSelectedEvent(null)}>Done</button></div></section></div>}</>;
}
function Calendar({ events, onNotify, large = false }: { events: EventItem[]; onNotify: (s: string) => void; large?: boolean }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = ["S","M","T","W","T","F","S"];
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });
  const eventDays = new Set(events.filter(e => e.startsAt).map(e => new Date(e.startsAt as string).toDateString()));
  return <div className={`admin-calendar ${large ? "is-large" : ""}`}>
    <div className="calendar-month"><button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">←</button><strong>{monthLabel}</strong><button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">→</button></div>
    <div className="calendar-weekdays">{days.map((d, i) => <span key={i}>{d}</span>)}</div>
    <div className="calendar-grid">
      {Array.from({ length: firstDay }, (_, i) => <i key={`blank-${i}`} aria-hidden="true" />)}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(year, month, day);
        const hasEvent = eventDays.has(date.toDateString());
        const isToday = date.toDateString() === today.toDateString();
        const dateKey = date.toDateString();
        const isSelected = selectedDate === dateKey;
        return <button key={day} aria-pressed={isSelected} className={`${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasEvent ? "has-event" : ""}`} onClick={() => { setSelectedDate(dateKey); onNotify(hasEvent ? `Events on ${date.toLocaleDateString([], { month: "long", day: "numeric" })}` : `${date.toLocaleDateString([], { month: "long", day: "numeric" })} selected`); }}>{day}{hasEvent && <b />}</button>;
      })}
    </div>
  </div>;
}

function Team({ data, onCycle, onNotify, role, onAdd, onDelete }: { data: TeamMember[]; onCycle: (id: string) => void; onNotify: (s: string) => void; role: string; onAdd: (member: TeamMember) => void; onDelete: (id: string) => void }) {
  const activityByRecord = useInlineAudit("team_members");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [name, setName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [campus, setCampus] = useState("Greater Noida");
  const [team, setTeam] = useState("Campus Innovation Fellow");
  const [yearOfStudy, setYearOfStudy] = useState("First Year");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = role === "admin";

  const openEdit = (member: TeamMember) => {
    setEditingMember(member); setName(member.name || ""); setMemberRole(member.role || ""); setCampus(member.campus || "Greater Noida"); setTeam(member.team || "Campus Innovation Fellow"); setYearOfStudy(member.yearOfStudy || "First Year"); setDegreeProgram(member.degreeProgram || ""); setContactEmail(member.email || ""); setPhotoFile(null); setPhotoPreview(member.photoUrl || ""); setShowForm(true);
  };

  const resetForm = () => {
    setName(""); setMemberRole(""); setCampus("Greater Noida"); setTeam("Campus Innovation Fellow");
    setYearOfStudy("First Year"); setDegreeProgram(""); setContactEmail(""); setPhotoFile(null); setPhotoPreview(""); setEditingMember(null); setShowForm(false);
  };

  const handlePhoto = (file: File | null) => {
    if (!file) { setPhotoFile(null); setPhotoPreview(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setPhotoFile(null); setPhotoPreview(""); onNotify("Use a JPG, PNG, or WebP image"); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoFile(null); setPhotoPreview(""); onNotify("Profile picture must be 5 MB or smaller"); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const remove = async (member: TeamMember) => {
    if (!canEdit) return onNotify("Only authorized admins can delete team members");
    if (!window.confirm(`Delete ${member.name} from the team roster? This cannot be undone.`)) return;
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      if (!session?.access_token) throw new Error("Please sign in again before deleting team members.");
      const response = await fetch("/api/admin/team-members", { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: member.id }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not delete team member");
      onDelete(member.id);
      onNotify("Team member deleted");
    } catch (err) { onNotify(err instanceof Error ? err.message : "Could not delete team member"); }
  };

  const create = async () => {
    if (!canEdit) return onNotify("Only authorized admins can add team members");
    if (!name.trim()) return onNotify("Add the member's full name first");
    if (!degreeProgram.trim()) return onNotify("Enter the degree program");
    setSaving(true);
    try {
      const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
      const body: Record<string, string> = { name: name.trim(), role: memberRole.trim(), campus, team, year_of_study: yearOfStudy, degree_program: degreeProgram.trim() };
      if (contactEmail.trim()) body.contact_email = contactEmail.trim();
      if (photoFile) {
        // Signed upload details come from Vercel; the image itself goes straight to Cloudinary.
        body.photo_url = await uploadImageDirectToCloudinary(photoFile, "team", session?.access_token);
      }

      if (supabaseConfigured && session?.access_token) {
        if (editingMember) {
          body.id = editingMember.id;
          if (!photoFile && editingMember.photoUrl) body.photo_url = editingMember.photoUrl;
        }
        const response = await fetch("/api/admin/team-members", { method: editingMember ? "PATCH" : "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || (editingMember ? "Could not update team member" : "Could not add team member"));
        const row = result.member;
        const member: TeamMember = { id: row.id, name: row.name, role: row.role || undefined, campus: row.campus, team: row.team, yearOfStudy: row.year_of_study || yearOfStudy, degreeProgram: row.degree_program || degreeProgram.trim(), status: row.published === false ? "Draft" : "Published", email: row.email || undefined, photoUrl: row.photo_url || undefined };
        if (editingMember) onAdd(member); else onAdd(member);
        resetForm();
        onNotify(editingMember ? "Team profile updated" : "Team profile added. Create any required sign-in account separately if needed.");
      } else {
        throw new Error("Admin services are unavailable or your session has expired. No team account was created.");
      }
    } catch(err) { onNotify(err instanceof Error ? err.message : "Could not add team member"); } finally { setSaving(false); }
  };

  return <>
    <PageIntro eyebrow="THE PEOPLE BEHIND IT" title="Meet the team" description="Admins can manage the public team roster and onboard approved members." action={canEdit ? "Add new member" : undefined} onAction={() => setShowForm(true)} />
    {showForm && <section className="admin-card composer-card team-composer">
      <div className="admin-card-head composer-head"><div><span>{editingMember ? "EDIT TEAM MEMBER · ADMIN" : "NEW TEAM MEMBER · ADMIN"}</span><h3>{editingMember ? "Update this team profile." : "Create a team profile."}</h3><p>This manages the public roster profile only. It does not create an Auth user or generate credentials.</p></div><button className="composer-close" onClick={resetForm}>Close</button></div>
      <div className="composer-layout team-composer-layout">
        <aside className="profile-preview">
          <span className="preview-kicker">PROFILE PREVIEW</span>
          <div className="profile-avatar-preview">{photoPreview ? <img src={photoPreview} alt="" /> : (name.trim() || "New Member").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div>
          <small>{team}</small><h4>{name.trim() || "New team member"}</h4><p>{memberRole.trim() || "Role is optional"}</p><span>{campus} · IILM</span>
          <div className="profile-preview-note">Public profile card</div>
        </aside>
        <div className="composer-main">
          <div className="composer-section-label"><span>01</span><div><b>Profile details</b><small>Role is optional. Choose exactly one of the two Lab teams.</small></div></div>
          <div className="composer-grid two-col">
            <label className="composer-field"><span>Full name <em>Required</em></span><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Aanya Sharma" /></label>
            <label className="composer-field"><span>Role <small>Optional</small></span><input value={memberRole} onChange={e=>setMemberRole(e.target.value)} placeholder="e.g. Content Lead" /></label>
            <label className="composer-field"><span>Campus <em>Required</em></span><select value={campus} onChange={e=>setCampus(e.target.value)}><option>Greater Noida</option><option>Gurugram</option><option>Rohtak</option><option>Lodhi Road</option><option>Jaipur</option></select></label>
            <label className="composer-field"><span>Team <em>Required</em></span><select value={team} onChange={e=>setTeam(e.target.value)}><option>Campus Innovation Fellow</option><option>Social Media</option></select></label>
            <label className="composer-field"><span>Year of study <em>Required</em></span><select value={yearOfStudy} onChange={e=>setYearOfStudy(e.target.value)}><option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option></select></label>
            <label className="composer-field"><span>Degree program <em>Required</em></span><input value={degreeProgram} onChange={e=>setDegreeProgram(e.target.value)} placeholder="e.g. B.Tech CSE (AI/ML)" maxLength={160} /></label>
            <label className="composer-field field-full"><span>Contact email <small>Optional · does not create a login</small></span><input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="member@iilm.edu" /></label>
            <label className="composer-field field-full"><span>Profile picture <small>Optional · JPG, PNG, WebP · max 5 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>handlePhoto(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="composer-actions"><button className="admin-secondary" onClick={resetForm}>Cancel</button><button className="admin-primary" disabled={saving} onClick={create}>{saving?(editingMember?"Saving changes…":"Adding profile…"):(editingMember?"Save changes ↗":"Add team profile ↗")}</button></div>
        </div>
      </div>
    </section>}
    <div className="team-admin-grid">{data.map(m => <article className="team-admin-card" key={m.id}><div className="team-avatar-admin">{m.photoUrl ? <img src={optimizedCloudinaryImageUrl(m.photoUrl, 480)} alt="" loading="lazy" decoding="async" width={480} height={480} /> : m.name.split(" ").map(x => x[0]).join("")}</div><h3>{m.name}</h3><p>{m.role || "Team member"}</p><small>{m.campus} · {m.team}</small>{(m.yearOfStudy || m.degreeProgram) && <small>{[m.yearOfStudy, m.degreeProgram].filter(Boolean).join(" · ")}</small>}<InlineActivity row={activityByRecord.get(String(m.id))} /><footer><Badge status={m.status} /><button disabled={!canEdit} onClick={() => onCycle(m.id)}>{canEdit ? "Toggle publish" : "View"}</button>{canEdit && <button type="button" className="team-edit-action" onClick={() => openEdit(m)}>Edit</button>}{canEdit && <button type="button" className="admin-danger" onClick={() => void remove(m)}>Delete</button>}</footer></article>)}</div>
  </>;
}

function Communities({ counts, onCountsChange, onNotify }: { counts: Record<string, number>; onCountsChange: (counts: Record<string, number>) => void; onNotify: (s: string) => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const data = [{name:"Explorer", tag:"−2", desc:"Curiosity → exploration", color:"green"},{name:"Ideator",tag:"−1 / 0",desc:"Idea → validation",color:"red"},{name:"Founder’s Club",tag:"+1",desc:"Execution → venture building",color:"navy"}];
  const saveCount = async (name: string) => {
    if (!supabaseConfigured) return onNotify("Admin services are temporarily unavailable. No changes were saved.");
    const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null;
    if (!session?.access_token) return onNotify("Sign in with an admin account to save counts");
    setSaving(name);
    try { const base=process.env.NEXT_PUBLIC_SUPABASE_URL; const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const res=await fetch(`${base}/rest/v1/communities?name=eq.${encodeURIComponent(name)}`,{method:"PATCH",headers:{apikey:anon||"",Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({member_count:Math.max(0,Number(counts[name]||0)),published:true})}); if(!res.ok)throw new Error("Could not save count"); onNotify(`${name} member count saved`);} catch(err){onNotify(err instanceof Error?err.message:"Could not save count");} finally{setSaving(null)}
  };
  return <><PageIntro eyebrow="THE JOURNEY" title="Communities" description="Shape the three-stage student journey and publish lightweight member counts for the public website." /><div className="community-admin-grid">{data.map(d => <article className={`community-admin-card ${d.color}`} key={d.name}><span>{d.tag}</span><h3>{d.name}</h3><p>{d.desc}</p><label className="community-count-input">Members<input type="number" min="0" value={counts[d.name] ?? 0} onChange={e=>onCountsChange({...counts,[d.name]:Number(e.target.value)})}/></label><button onClick={()=>saveCount(d.name)} disabled={saving===d.name}>{saving===d.name?"Saving…":"Save count →"}</button></article>)}</div><section className="admin-card admin-note"><span>EDITOR NOTE</span><h3>Founder’s Club is currently marked Coming Soon.</h3><p>Keep the launch state visible until the selection and incubation workflow is ready.</p></section></>;
}
function Social({ onNotify, initialShorts }: { onNotify: (s: string) => void; initialShorts: string[] }) {
  const activityByRecord = useInlineAudit("youtube_shorts");
  const [shorts, setShorts] = useState<string[]>(initialShorts);
  useEffect(() => { setShorts(initialShorts); }, [initialShorts]);
  const [showForm, setShowForm] = useState(false); const [videoId, setVideoId] = useState(""); const [title, setTitle] = useState(""); const [saving, setSaving] = useState(false);
  const addShort = async () => {
    const id = videoId.trim().replace(/.*(?:v=|youtu\.be\/|shorts\/)/, "").split(/[?&#/]/)[0];
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return onNotify("Enter a valid YouTube URL or video ID");
    setSaving(true);
    try { const raw=localStorage.getItem("iilm-admin-session"); const session=raw?JSON.parse(raw):null; if(!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before adding Shorts."); await restInsert("youtube_shorts",session.access_token,{youtube_id:id,title:title.trim()||null,published:true,display_order:shorts.length}); setShorts(list=>[id,...list.filter(x=>x!==id)]); setVideoId(""); setTitle(""); setShowForm(false); onNotify("YouTube Short added"); }
    catch(err){onNotify(err instanceof Error?err.message:"Could not add Short");} finally{setSaving(false);}
  };
  return <><PageIntro eyebrow="CONTENT THAT MOVES" title="YouTube Shorts" description="Manage the short-form video strip without rebuilding the homepage." action="Add Short" onAction={() => setShowForm(true)} />
    {showForm && <section className="admin-card event-composer"><div className="admin-card-head"><div><span>NEW SHORT</span><h3>Add a YouTube Short.</h3></div><button onClick={()=>setShowForm(false)}>Close</button></div><div className="announcement-fields"><label>YouTube URL or ID<input value={videoId} onChange={e=>setVideoId(e.target.value)} placeholder="https://youtube.com/shorts/..." /></label><label>Title (optional)<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What is this Short about?" /></label></div><button className="admin-primary" disabled={saving} onClick={addShort}>{saving?"Saving…":"Add Short ↗"}</button></section>}
    <div className="shorts-admin-grid">{shorts.map((id,i)=><article key={id} className="short-admin-card"><div className="short-admin-preview"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={`YouTube Short preview ${i+1}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><footer><b>{id}</b><a href={`https://www.youtube.com/shorts/${id}`} target="_blank" rel="noreferrer">Open ↗</a></footer><InlineActivity row={activityByRecord.get(String(id))} /></article>)}{shorts.length === 0 && <p className="admin-empty">No published YouTube Shorts yet. Add a Short to display it here.</p>}</div>
    <section className="admin-card admin-social-note"><div><span>YOUTUBE ONLY</span><h3>Keep the public social strip focused.</h3><p>YouTube Shorts are the only social content managed here.</p></div></section></>;
}

function Announcements({ onNotify }: { onNotify: (s: string) => void }) {
  const activityByRecord = useInlineAudit("announcements");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sendPush, setSendPush] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [recent, setRecent] = useState<Array<Record<string, any> & {id:string;title:string;body?:string|null;published:boolean;created_at?:string}>>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<(Record<string, any> & {id:string;title:string;body?:string|null;published:boolean;created_at?:string}) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const raw = localStorage.getItem("iilm-admin-session");
        const session = raw ? JSON.parse(raw) : null;
        if (!supabaseConfigured || !session?.access_token) return;
        const rows = await restSelect("announcements", session.access_token, "select=*&order=created_at.desc&limit=20");
        if (!cancelled && Array.isArray(rows)) setRecent(rows);
      } catch (error) { console.error("Could not load announcements", error); }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const saveAnnouncement = async (published: boolean) => {
    if (!title.trim()) return onNotify("Add a headline first");
    if (published && !body.trim()) return onNotify("Add a message before publishing");
    setPublishing(true);
    try {
      const raw = localStorage.getItem("iilm-admin-session");
      const session = raw ? JSON.parse(raw) : null;
      if (!supabaseConfigured || !session?.access_token) throw new Error("Please sign in again before saving announcements.");
      const rows = await restInsert("announcements", session.access_token, { title: title.trim(), body: body.trim() || null, cta_label: ctaLabel.trim() || null, cta_url: ctaUrl.trim() || null, published, published_at: published ? new Date().toISOString() : null });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.id) throw new Error("The announcement was not returned by the database. Check your permissions.");
      setRecent(current => [{ ...row, id: row.id, title: title.trim(), body: body.trim() || null, cta_label: ctaLabel.trim() || null, cta_url: ctaUrl.trim() || null, published, published_at: published ? new Date().toISOString() : null, created_at: row.created_at || new Date().toISOString() }, ...current]);
      if (published && sendPush) {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const push = await fetch(`${base}/functions/v1/send-notification`, { method: "POST", headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), body: body.trim(), url: ctaUrl.trim() || "/#announcements" }) });
        onNotify(push.ok ? "Announcement published and notification sent" : "Announcement published; push notification could not be sent");
      } else onNotify(published ? "Announcement published to the website" : "Announcement saved as a draft");
      setTitle(""); setBody(""); setCtaLabel(""); setCtaUrl(""); setSendPush(false);
    } catch (err) { onNotify(err instanceof Error ? err.message : "Could not save announcement"); }
    finally { setPublishing(false); }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!window.confirm("Delete this announcement permanently? This cannot be undone.")) return;
    try { const raw = localStorage.getItem("iilm-admin-session"); const session = raw ? JSON.parse(raw) : null; const base = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!session?.access_token || !base || !anon) throw new Error("Please sign in again before deleting announcements."); const res = await fetch(`${base}/rest/v1/announcements?id=eq.${encodeURIComponent(id)}`, { method:"DELETE", headers:{apikey:anon,Authorization:`Bearer ${session.access_token}`,Prefer:"return=minimal"} }); if (!res.ok) throw new Error("Could not delete announcement. Check your admin permissions."); setRecent(items => items.filter(item => item.id !== id)); setSelectedAnnouncement(null); onNotify("Announcement deleted"); } catch(err) { onNotify(err instanceof Error ? err.message : "Could not delete announcement"); }
  };
  return <><PageIntro eyebrow="TELL PEOPLE WHAT'S HAPPENING" title="Announcements" description="Publish updates directly to the public website. Every published change records who made it." action="New announcement" onAction={() => document.getElementById("announcement-composer")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
    <section className="admin-card composer-card announcement-composer" id="announcement-composer">
      <div className="admin-card-head composer-head"><div><span>ANNOUNCEMENT BUILDER</span><h3>Say the useful thing.</h3><p>Keep the public update short, clear and easy to act on.</p></div><span className="composer-status"><i /> Ready to publish</span></div>
      <div className="composer-layout announcement-layout">
        <div className="composer-main">
          <div className="composer-section-label"><span>01</span><div><b>Message</b><small>This is the content students will actually read.</small></div></div>
          <label className="composer-field field-full"><span>Headline <em>Required</em></span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Explorer applications are open" /></label>
          <label className="composer-field field-full"><span>Message <em>Required to publish</em></span><textarea className="announcement-message" value={body} onChange={e=>setBody(e.target.value)} placeholder="Write the short update students should see…" /></label>
          <div className="composer-section-label composer-section-spaced"><span>02</span><div><b>Call to action</b><small>Optional — give students a clear next step.</small></div></div>
          <div className="composer-grid two-col">
            <label className="composer-field"><span>CTA label <small>Optional</small></span><input value={ctaLabel} onChange={e=>setCtaLabel(e.target.value)} placeholder="Apply now" /></label>
            <label className="composer-field"><span>CTA link <small>Optional</small></span><input value={ctaUrl} onChange={e=>setCtaUrl(e.target.value)} placeholder="https://…" /></label>
          </div>
          <label className="composer-checkbox"><input type="checkbox" checked={sendPush} onChange={e=>setSendPush(e.target.checked)} /><span><b>Send browser notification</b><small>Notify visitors who have opted in to Lab updates.</small></span></label>
          <div className="audit-preview composer-audit"><span>AUTHOR</span><div><b>{identityName()}</b><small>Saved automatically in the activity history.</small></div></div>
          <div className="composer-actions"><button className="admin-secondary" disabled={publishing} onClick={() => void saveAnnouncement(false)}>{publishing ? "Saving…" : "Save draft"}</button><button className="admin-primary" disabled={publishing} onClick={() => void saveAnnouncement(true)}>{publishing ? "Saving…" : "Publish to website ↗"}</button></div>
        </div>
        <aside className="composer-preview announcement-preview">
          <div className="preview-kicker"><span>LIVE PREVIEW</span><b>WEBSITE ANNOUNCEMENT</b></div>
          <div className="announcement-preview-card"><span>LAB UPDATE</span><h4>{title.trim() || "Your announcement headline"}</h4><p>{body.trim() || "Your short public message will appear here. Keep it useful, specific and easy to scan."}</p>{ctaLabel.trim() && <a href={ctaUrl.trim() || "#"} onClick={e=>{if(!ctaUrl.trim())e.preventDefault()}}>{ctaLabel.trim()} <b>↗</b></a>}</div>
          <small className="preview-footnote">Preview only · Published content is saved to the website.</small>
        </aside>
      </div>
    </section>
    <section className="admin-card admin-list-card announcement-list-section"><div className="admin-card-head"><div><span>RECENT</span><h3>Announcements</h3><p>Select an announcement to view its full content.</p></div><span className="announcement-count">{recent.length} {recent.length === 1 ? "announcement" : "announcements"}</span></div>{recent.length ? <div className="announcement-card-grid">{recent.map(item => <button type="button" className="announcement-detail-trigger announcement-list-card" key={item.id} onClick={() => setSelectedAnnouncement(item)} aria-label={`View details for ${item.title}`}><div className="announcement-list-card-top"><span className="announcement-list-icon">↗</span><Badge status={item.published ? "Published" : "Draft"} /></div><h4>{item.title || "Untitled announcement"}</h4><p className="announcement-list-message">{item.body || "No message added yet."}</p><div className="announcement-list-card-bottom"><small>{item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}</small><span>View details <b>↗</b></span></div></button>)}</div> : <p className="admin-empty">No announcements are stored yet.</p>}</section>
    {selectedAnnouncement && <div className="announcement-detail-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedAnnouncement(null); }}><section className="admin-card announcement-detail-panel" role="dialog" aria-modal="true" aria-labelledby="announcement-detail-title"><div className="admin-card-head"><div><span>ANNOUNCEMENT DETAILS</span><h3 id="announcement-detail-title">{selectedAnnouncement.title || "Untitled announcement"}</h3><p>Complete saved content and publication information.</p></div><button type="button" className="admin-secondary" onClick={() => setSelectedAnnouncement(null)}>Close ✕</button></div><div className="announcement-detail-status"><Badge status={selectedAnnouncement.published ? "Published" : "Draft"} /><span>Created {selectedAnnouncement.created_at ? new Date(selectedAnnouncement.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "date unavailable"}</span></div><div className="announcement-detail-content"><div className="announcement-detail-field"><span>HEADLINE</span><h4>{selectedAnnouncement.title || "—"}</h4></div><div className="announcement-detail-field"><span>MESSAGE</span><p className="announcement-detail-message">{selectedAnnouncement.body || "No message saved."}</p></div><div className="announcement-detail-field"><span>CALL TO ACTION LABEL</span><p>{selectedAnnouncement.cta_label || "Not configured"}</p></div><div className="announcement-detail-field"><span>CALL TO ACTION LINK</span>{selectedAnnouncement.cta_url ? <a href={selectedAnnouncement.cta_url} target="_blank" rel="noreferrer">{selectedAnnouncement.cta_url} ↗</a> : <p>Not configured</p>}</div>{Object.entries(selectedAnnouncement).filter(([key, value]) => !["id","title","body","cta_label","cta_url","published","created_at","published_at","updated_at","created_by","created_by_name","updated_by","updated_by_name","deleted_by","deleted_by_name","created_at_ist","updated_at_ist"].includes(key) && value !== null && value !== undefined && value !== "").map(([key, value]) => <div className="announcement-detail-field" key={key}><span>{key.replaceAll("_", " ").toUpperCase()}</span>{typeof value === "string" && /image|photo|banner|thumbnail|media|url/i.test(key) && /^https?:\/\//i.test(value) ? <><a href={value} target="_blank" rel="noreferrer">{value} ↗</a><img className="announcement-detail-image" src={value} alt={key.replaceAll("_", " ")} /></> : <p>{typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</p>}</div>)}</div><div className="announcement-detail-footer"><InlineActivity row={activityByRecord.get(String(selectedAnnouncement.id))} /><div><button type="button" className="admin-secondary" onClick={() => void deleteAnnouncement(selectedAnnouncement.id)}>Delete announcement</button> <button type="button" className="admin-primary" onClick={() => setSelectedAnnouncement(null)}>Done</button></div></div></section></div>}
    <style jsx>{`.announcement-list-section{overflow:hidden}.announcement-list-section>.admin-card-head{align-items:center}.announcement-list-section>.admin-card-head p{margin:7px 0 0;color:#78869a;font-size:12px}.announcement-count{font-size:11px;font-weight:700;color:#78869a;background:#f3f5f8;padding:8px 11px;border-radius:999px;white-space:nowrap}.announcement-card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding-top:8px}.announcement-detail-trigger{width:100%;text-align:left;border:1px solid #e5e9ef;border-radius:16px;background:#fff;color:inherit;cursor:pointer;font:inherit;padding:20px;display:flex;flex-direction:column;min-height:205px;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.announcement-detail-trigger:hover{background:#fff;border-color:#c8d2df;box-shadow:0 10px 28px rgba(17,43,76,.08);transform:translateY(-2px)}.announcement-list-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.announcement-list-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#f7edf0;color:#a71936;font-size:18px;font-weight:800}.announcement-list-card h4{margin:0 0 9px;color:#112b4c;font-size:17px;line-height:1.35;overflow-wrap:anywhere}.announcement-list-message{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;margin:0;color:#65748a;font-size:13px;line-height:1.65;flex:1}.announcement-list-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #edf0f4;padding-top:14px;margin-top:18px}.announcement-list-card-bottom small{color:#8793a4;font-size:11px}.announcement-list-card-bottom>span{color:#a71936;font-size:12px;font-weight:800;white-space:nowrap}.announcement-detail-overlay{position:fixed;inset:0;z-index:1000;background:rgba(8,24,44,.62);display:flex;align-items:center;justify-content:center;padding:24px;overflow-y:auto}.announcement-detail-panel{width:min(900px,100%);max-height:min(90vh,1000px);overflow:auto;padding:28px}.announcement-detail-status{display:flex;align-items:center;gap:14px;color:#778397;font-size:12px;margin:8px 0 24px}.announcement-detail-content{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.announcement-detail-field{min-width:0;padding:16px;border:1px solid #e5e9ef;border-radius:12px;background:#fff}.announcement-detail-field>span{display:block;font-size:10px;letter-spacing:1.4px;font-weight:800;color:#78869a;margin-bottom:9px}.announcement-detail-field h4{margin:0;font-size:17px;color:#112b4c}.announcement-detail-field p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;color:#34445a;line-height:1.65}.announcement-detail-field a{overflow-wrap:anywhere;color:#a71936}.announcement-detail-message{min-height:36px}.announcement-detail-image{display:block;max-width:100%;max-height:280px;object-fit:contain;margin-top:12px;border-radius:8px}.announcement-detail-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px;padding-top:18px;border-top:1px solid #e5e9ef}.announcement-detail-footer .admin-primary{flex-shrink:0}@media(max-width:680px){.announcement-card-grid{grid-template-columns:1fr}.announcement-detail-overlay{padding:10px;align-items:flex-start}.announcement-detail-panel{padding:18px;max-height:calc(100vh - 20px)}.announcement-detail-content{grid-template-columns:1fr}.announcement-detail-footer{align-items:flex-start;flex-direction:column}.announcement-count{font-size:10px}}`}</style></>;
}
function identityName(){ try { const raw=localStorage.getItem("iilm-admin-session"); return raw ? JSON.parse(raw)?.identity?.name || "Admin" : "Admin"; } catch { return "Admin"; }}

