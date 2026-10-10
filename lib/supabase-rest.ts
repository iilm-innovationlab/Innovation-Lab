export type AuthSession = { access_token: string; refresh_token: string; user: { id: string; email?: string } };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  if (!url || !anon) throw new Error("Supabase environment variables are not configured.");
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.msg || "Invalid email or password.");
  return data;
}

export async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
  if (!url || !anon) throw new Error("Supabase environment variables are not configured.");
  const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.msg || "Admin session expired.");
  return data;
}

export async function signOut(accessToken: string) {
  if (!url || !anon) return;
  await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
}

export async function getCurrentUser(accessToken: string) {
  if (!url || !anon) return null;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return res.json();
}

export async function restSelect(table: string, accessToken: string, query = "select=*") {
  if (!url || !anon) throw new Error("Supabase environment variables are not configured.");
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: anon, Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not load data.");
  return data;
}

export async function restInsert(table: string, accessToken: string, row: Record<string, unknown>) {
  if (!url || !anon) throw new Error("Supabase environment variables are not configured.");
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.hint || "Could not save data.");
  return data;
}

export async function getMyProfile(accessToken: string, authenticatedUserId: string) {
  // Always bind the profile lookup to the user returned by Supabase Auth.
  // An unfiltered `limit=1` can return another user's profile and apply their role
  // to the currently signed-in session.
  if (!authenticatedUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authenticatedUserId)) {
    throw new Error("Could not verify the signed-in account ID. Please sign in again.");
  }
  const rows = await restSelect(
    "profiles",
    accessToken,
    `select=id,email,full_name,role&id=eq.${encodeURIComponent(authenticatedUserId)}&limit=2`,
  );
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== authenticatedUserId) return null;
  return rows[0];
}

export async function restUpsert(table: string, accessToken: string, rows: Record<string, unknown>[]) {
  if (!url || !anon) throw new Error("Supabase environment variables are not configured.");
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || data?.hint || `Could not restore ${table}.`);
  }
}
