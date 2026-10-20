import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import SectionLabel from "@/components/SectionLabel";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;
export const metadata: Metadata = pageMetadata({ title: "Star Ideators | IILM × BNV Innovation Lab", description: "Meet students turning observations into ideas, experiments and early solutions at IILM × BNV Innovation Lab.", path: "/star-ideators", keywords: ["IILM Star Ideators", "student innovators", "student entrepreneurship"] });

type StarIdeator = { id: string; name: string; role?: string | null; bio?: string | null; photo_url?: string | null; linkedin_url?: string | null };
async function getStarIdeators(): Promise<StarIdeator[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try { const res = await fetch(`${url}/rest/v1/star_ideators?select=id,name,role,bio,photo_url,linkedin_url&published=eq.true&order=display_order.asc,created_at.desc&limit=60`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-star-ideators"] } }); return res.ok ? await res.json() : []; } catch { return []; }
}
export default async function StarIdeatorsPage() { const items = await getStarIdeators(); return <main className="page-shell"><div className="container"><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Star Ideators", path: "/star-ideators" }]} /><SectionLabel>Ideas worth watching</SectionLabel><h1 className="mega">Meet our <i>Star Ideators.</i></h1><p className="lead-copy">Students turning observations into ideas, experiments and early solutions. These profiles are published by the Innovation Lab team.</p>{items.length ? <div className="star-ideators-public-grid">{items.map(item => <article className="star-ideator-public-card" key={item.id}>{item.photo_url ? <img className="star-ideator-public-photo" src={item.photo_url} alt={item.name} loading="lazy" decoding="async"/> : <div className="star-ideator-public-placeholder">{item.name.split(" ").map(part => part[0]).join("").slice(0,2).toUpperCase()}</div>}<div className="star-ideator-public-copy"><span>STAR IDEATOR</span><h2>{item.name}</h2>{item.role && <h3>{item.role}</h3>}{item.bio && <p>{item.bio}</p>}{item.linkedin_url && <a href={item.linkedin_url} target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a>}</div></article>)}</div> : <div className="star-ideators-empty"><strong>Great ideas start with people.</strong><p>Our Star Ideators will be featured here as soon as their profiles are published.</p></div>}<div style={{ marginTop: 44 }}><Link href="/#journey" className="hero-btn hero-btn-red">How to be a member ↗</Link></div></div></main>; }
