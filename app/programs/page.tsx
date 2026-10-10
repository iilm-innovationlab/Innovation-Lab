import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import Journey from "@/components/Journey";
import MaturityJourney from "@/components/MaturityJourney";
export const metadata: Metadata = pageMetadata({ title: "IILM Innovation Lab Journey | Explorer → Ideator → Founder", description: "Understand the IILM × BNV Innovation Lab member journey from curiosity and discovery through Explorer, Ideator, validation, prototyping and Founder’s Club.", path: "/programs", keywords: ["IILM Innovation Lab journey", "IILM Explorer", "IILM Ideator", "IILM Founder’s Club", "IILM entrepreneurship program", "student startup journey"] });

export default function ProgramsPage(){return <main className="page-shell"><div className="container"><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Member Journey", path: "/programs" }]} /><SectionLabel>Member journey</SectionLabel><h1 className="mega">Explorer →<br/>Ideator →<br/><i>Founder’s Club.</i></h1><p className="lead-copy">The public journey has exactly three communities. Community Member is an internal membership status, not a fourth stage.</p><Journey/><section className="page-subsection"><SectionLabel>Maturity framework</SectionLabel><h2 className="mega small-mega">Where are you from <i>−2 to +1?</i></h2><MaturityJourney/></section><Link href="/join" className="hero-btn hero-btn-red">Start your journey ↗</Link></div></main>}
