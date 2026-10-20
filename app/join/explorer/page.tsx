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

import { redirect } from "next/navigation";

export default function ApplicationRedirect(){
  redirect("https://docs.google.com/forms/d/e/1FAIpQLSeXGLOz90reucU1Zkjzbhvhs9aNvne9ViELQ1es_4LGB0rdQQ/viewform");
}
