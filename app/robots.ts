import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");
  return {
    rules: production ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: production ? `${siteUrl}/sitemap.xml` : undefined,
    host: production ? siteUrl : undefined,
  };
}
