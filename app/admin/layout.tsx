import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Studio",
  description: "IILM × BNV Innovation Lab administration workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
