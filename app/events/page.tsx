import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";
import SectionLabel from "@/components/SectionLabel";
import EventCalendar from "@/components/EventCalendar";
import PushNotifications from "@/components/PushNotifications";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: "IILM Innovation Lab Events & Sessions", description: "Explore Innovation Lab sessions, workshops, talks, hackathons and Founder’s Club activities for IILM students as they are published.", path: "/events", keywords: ["IILM Innovation Lab events", "IILM entrepreneurship events", "IILM startup workshops", "student innovation workshops", "IILM hackathon"] });

async function getEvents() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try { const res = await fetch(`${url}/rest/v1/events?select=id,title,description,starts_at,community,location,registration_url&status=eq.published&order=starts_at.asc&limit=40`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-events"] } }); return res.ok ? await res.json() : []; } catch { return []; }
}

export default async function EventsPage(){ const events = await getEvents(); return <main className="page-shell"><div className="container"><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Events", path: "/events" }]} /><SectionLabel>Sessions & events</SectionLabel><h1 className="mega">Show up.<br/><i>Make something.</i></h1><p className="lead-copy">Workshops, sessions, founder conversations and campus opportunities published by the Lab team.</p><PushNotifications /><EventCalendar events={events} /></div></main> }
