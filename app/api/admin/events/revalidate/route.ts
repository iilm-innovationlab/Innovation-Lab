import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate the caller's Supabase access token before allowing cache invalidation.
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" }).catch(() => null);
  if (!userResponse?.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  revalidateTag("public-events", { expire: 0 });
  revalidatePath("/", "page");
  revalidatePath("/events", "page");
  return NextResponse.json({ revalidated: true });
}
