import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import SectionLabel from "@/components/SectionLabel";
import Link from "next/link";
import GeneralApplication from "@/components/GeneralApplication";

export const metadata: Metadata = pageMetadata({
  title: "Campus Innovation Fellow Application | IILM × BNV Innovation Lab",
  description: "Apply to become a Campus Innovation Fellow at the IILM × BNV Innovation Lab.",
  path: "/join/campus-innovation-fellow",
  keywords: ["IILM Campus Innovation Fellow", "IILM CIF", "IILM BNV Innovation Lab team"]
});

export default function CampusInnovationFellowPage(){
  return <main className="page-shell"><div className="container">
    <BreadcrumbJsonLd items={[{name:"Home",path:"/"},{name:"Join the Lab",path:"/join"},{name:"Campus Innovation Fellow",path:"/join/campus-innovation-fellow"}]} />
    <SectionLabel>Join the team / Campus Innovation Fellow</SectionLabel>
    <h1 className="mega">Build the<br/><i>campus.</i></h1>
    <p className="lead-copy">Apply to become a Campus Innovation Fellow and tell us how you would help students discover ideas, join activities, and build across campus.</p>
    <GeneralApplication type="campus_innovation_fellow" />
    <Link href="/join" className="text-link">← Back to Join</Link>
  </div></main>
}
