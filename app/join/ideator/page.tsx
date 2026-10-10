import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import SectionLabel from "@/components/SectionLabel";
import Link from "next/link";
import GeneralApplication from "@/components/GeneralApplication";

export const metadata: Metadata = pageMetadata({
  title: "Ideator Application | IILM × BNV Innovation Lab",
  description: "Apply to the IILM × BNV Innovation Lab Ideator community.",
  path: "/join/ideator",
  keywords: ["IILM Ideator", "IILM Innovation Lab Ideator", "IILM BNV startup ideas"]
});

export default function IdeatorPage(){
  return <main className="page-shell"><div className="container">
    <BreadcrumbJsonLd items={[{name:"Home",path:"/"},{name:"Join the Lab",path:"/join"},{name:"Ideator",path:"/join/ideator"}]} />
    <SectionLabel>Join a community / Ideator</SectionLabel>
    <h1 className="mega">You have an<br/><i>idea.</i></h1>
    <p className="lead-copy">Apply to the Ideator community and tell us about the problem you want to solve, the people affected, and what you have learned so far.</p>
    <GeneralApplication type="ideator" />
    <Link href="/join" className="text-link">← Back to Join</Link>
  </div></main>
}
