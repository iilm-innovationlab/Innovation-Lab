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

import { redirect } from "next/navigation";

export default function ApplicationRedirect(){
  redirect("https://docs.google.com/forms/d/e/1FAIpQLSewTWJAor6stfQqEEeszr2kP-yUjNg2T8yJmpfpAGmE3YECJg/viewform");
}
