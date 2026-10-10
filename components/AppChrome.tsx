"use client";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import MagneticCursor from "@/components/MagneticCursor";
import InnovationLoader from "@/components/InnovationLoader";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <InnovationLoader />
      <MagneticCursor />
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
