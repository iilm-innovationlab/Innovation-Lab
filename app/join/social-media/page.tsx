import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import SectionLabel from "@/components/SectionLabel";
import SocialMediaApplication from "@/components/SocialMediaApplication";

export const metadata: Metadata = pageMetadata({
  title: "IILM × BNV Social Media Team Application",
  description: "Apply to the IILM × BNV Social Media Team. Bring creativity, humour, content, design, editing and Gen Z energy to the Innovation Lab brand.",
  path: "/join/social-media",
  keywords: ["IILM Social Media Team", "IILM BNV Social Media", "IILM student content creator", "IILM social media internship", "IILM Innovation Lab team"]
});

import { redirect } from "next/navigation";

export default function ApplicationRedirect(){
  redirect("https://docs.google.com/forms/d/e/1FAIpQLSdZWcXIpYW5xcnQhxJhSAvQ1myxeGmLpH-l1NIHLI4BxuU-wQ/viewform");
}
