"use client";
import Image from "next/image";
import { cloudinaryConfigured, cloudinaryLoader } from "@/lib/cloudinary-image";

export default function CloudinaryImage({ publicId, alt, sizes, priority = false }: { publicId: string; alt: string; sizes: string; priority?: boolean }) {
  if (!cloudinaryConfigured) return null;
  return <Image src={publicId} alt={alt} fill sizes={sizes} loader={cloudinaryLoader} priority={priority} />;
}
