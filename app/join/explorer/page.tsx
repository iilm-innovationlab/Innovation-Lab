import type { Metadata } from "next";
import ExplorerApplication from "@/components/ExplorerApplication";
import SectionLabel from "@/components/SectionLabel";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Explorer Application | IILM × BNV Innovation Lab",
  description: "Apply to become an Explorer at the IILM × BNV Innovation Lab. Explore entrepreneurship, attend sessions, meet founders and turn curiosity into action.",
  path: "/join/explorer",
  keywords: ["IILM Explorer", "IILM Innovation Lab application", "IILM entrepreneurship", "IILM startup community", "IILM BNV Explorer"]
});

export default function ExplorerPage(){
  return <main className="page-shell explorer-page"><div className="container"><SectionLabel>Explorer / IILM × BNV Innovation Lab</SectionLabel><h1 className="mega">You don’t need<br/><i>an idea.</i></h1><p className="lead-copy">You just need curiosity. Explorer is for IILM students who want to understand entrepreneurship, discover opportunities and learn how startups are built.</p><div className="explorer-promise"><span>CURIOUS ≠ BEHIND</span><p>Once you submit, the confirmation screen gives you the WhatsApp Community link. That’s where sessions, workshops, masterclasses, competitions and other Innovation Lab opportunities show up.</p></div><ExplorerApplication/></div></main>
}
