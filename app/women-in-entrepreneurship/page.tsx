import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import WomenBuild from "@/components/WomenBuild";

export const metadata: Metadata = pageMetadata({
  title: "Women Who Build | IILM Innovation Lab",
  description: "Meet women who have built companies, challenge common founder myths, and find inspiration for your own entrepreneurial journey with IILM × BNV Innovation Lab.",
  path: "/women-in-entrepreneurship",
  keywords: ["women in entrepreneurship", "women founders", "IILM Innovation Lab", "women who build"],
});

export default function WomenInEntrepreneurshipPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Women Who Build", path: "/women-in-entrepreneurship" }]} />
      </div>
      <WomenBuild />
    </main>
  );
}
