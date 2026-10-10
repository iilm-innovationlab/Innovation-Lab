import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, defaultDescription, primaryKeywords, siteName, siteUrl } from "@/lib/seo";

const isProduction = process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IILM Innovation Lab | IILM × BNV Student Entrepreneurship & Innovation",
    template: "%s | IILM × BNV Innovation Lab",
  },
  description: defaultDescription,
  keywords: primaryKeywords,
  applicationName: siteName,
  category: "education",
  authors: [{ name: "IILM × BNV Innovation Lab" }],
  creator: "IILM × BNV Innovation Lab",
  publisher: "IILM × BNV Innovation Lab",
  alternates: { canonical: siteUrl },
  robots: isProduction
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "IILM Innovation Lab | IILM × BNV Student Entrepreneurship & Innovation",
    description: defaultDescription,
    locale: "en_IN",
    images: [{ url: absoluteUrl("/og-image.jpg"), width: 1200, height: 630, alt: "IILM × BNV Innovation Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IILM Innovation Lab | IILM × BNV Student Entrepreneurship & Innovation",
    description: defaultDescription,
    images: [absoluteUrl("/og-image.jpg")],
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c2a4a",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/iilm-bnv-logo-user-cropped.webp"),
    description: defaultDescription,
    sameAs: ["https://iilm.edu/", "https://beyondnextventures.com/"],
    areaServed: "India",
    knowsAbout: ["student entrepreneurship", "innovation", "startup building", "deep-tech ecosystem", "venture building"],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    inLanguage: "en-IN",
    publisher: { "@type": "Organization", name: siteName, url: siteUrl },
  };

  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body>
        <JsonLd data={[organization, website]} />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
