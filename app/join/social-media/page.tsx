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

export default function SocialMediaPage(){
  return <main className="page-shell social-page"><div className="container">
    <BreadcrumbJsonLd items={[{name:"Home",path:"/"},{name:"Join the Lab",path:"/join"},{name:"Social Media Team",path:"/join/social-media"}]} />
    <SectionLabel>Join our team / Social Media</SectionLabel>
    <SocialMediaApplication />
  </div></main>
}
