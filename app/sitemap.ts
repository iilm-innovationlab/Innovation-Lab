import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: absoluteUrl("/programs"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/ecosystem"), lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: absoluteUrl("/team"), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: absoluteUrl("/events"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: absoluteUrl("/join"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
  ];
}
