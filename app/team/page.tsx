import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import SectionLabel from "@/components/SectionLabel";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PushNotifications from "@/components/PushNotifications";
import { optimizedCloudinaryImageUrl } from "@/lib/cloudinary-url";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: "IILM × BNV Innovation Lab Team", description: "Meet the student team building the IILM × BNV Innovation Lab across Greater Noida, Gurugram and Rohtak.", path: "/team", keywords: ["IILM Innovation Lab team", "IILM BNV team", "Campus Innovation Fellow", "IILM Social Media Team"] });


async function getTeam(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!anon)return [];try{const r=await fetch(`${url}/rest/v1/team_members?select=id,name,role,campus,team,photo_url,bio,linkedin_url&published=eq.true&order=display_order.asc&limit=30`,{headers:{apikey:anon},next:{revalidate:600,tags:["public-team"]}});if(!r.ok)return [];const data=await r.json();return data}catch{return []}}

export default async function TeamPage(){const team=await getTeam();return <main className="page-shell"><div className="container"><BreadcrumbJsonLd items={[{name:"Home",path:"/"},{name:"Team",path:"/team"}]} /><SectionLabel>The people behind the Lab</SectionLabel><h1 className="mega">The people.<br/><i>Behind the Lab.</i></h1><p className="lead-copy">Campus Innovation Fellows and Social Media team members helping students discover, build and share.</p><PushNotifications /><div className="public-team-grid">{team.map((m:any)=><article className="public-team-card" key={m.id}><div className="public-team-photo">{m.photo_url?<img src={optimizedCloudinaryImageUrl(m.photo_url, 480)} alt={m.name} loading="lazy" decoding="async" width={480} height={480}/>:<span>{m.name.split(" ").map((x:string)=>x[0]).join("").slice(0,2)}</span>}</div><small>{m.team === "Campus Innovation Fellow" ? "Campus Innovation Fellow" : "Social Media Team"}</small><h3>{m.name}</h3><span>{m.campus}</span>{m.bio&&<div className="public-team-bio">{m.bio}</div>}{m.linkedin_url&&<a href={m.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}</article>)}</div></div></main>}
