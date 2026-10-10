import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://iilm-bnv-innovation-lab.vercel.app").replace(/\/$/, "");
export const siteName = "IILM × BNV Innovation Lab";
export const defaultDescription =
  "IILM × BNV Innovation Lab is a student innovation and entrepreneurship ecosystem helping students discover problems, explore ideas, validate concepts, build prototypes and move toward venture building across IILM campuses.";

export const primaryKeywords = [
  "IILM Innovation Lab",
  "IILM BNV Innovation Lab",
  "IILM entrepreneurship",
  "IILM innovation",
  "IILM startup ecosystem",
  "IILM student entrepreneurship",
  "IILM startup incubation",
  "student innovation India",
  "student entrepreneurship India",
  "Beyond Next Ventures India",
  "BNV India",
  "IILM BNV",
];

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  keywords = primaryKeywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title,
      description,
      locale: "en_IN",
      images: [{ url: absoluteUrl("/og-image.jpg"), width: 1200, height: 630, alt: `${siteName} — ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/og-image.jpg")],
    },
  };
}
