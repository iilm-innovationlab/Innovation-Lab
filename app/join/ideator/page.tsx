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

import { redirect } from "next/navigation";

export default function ApplicationRedirect(){
  redirect("https://docs.google.com/forms/d/e/1FAIpQLSd5_D1K4ZPvJqQ9xOqQW6xmxgyMq6RustO8rIBSQ7j3bcIVWA/viewform");
}
