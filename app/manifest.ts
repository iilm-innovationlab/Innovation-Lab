import type { MetadataRoute } from "next";
import { siteUrl, siteName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: "IILM Innovation Lab",
    description: "IILM × BNV student innovation and entrepreneurship ecosystem.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#0c2a4a",
    icons: [{ src: `${siteUrl}/icon.png`, sizes: "512x512", type: "image/png" }],
  };
}
