import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { PartViewer } from "@/components/sections/part-viewer";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("impressao-3d");

export const metadata: Metadata = {
  title: "Impressão 3D",
  description: pillar?.summary,
  alternates: { canonical: "/impressao-3d" },
};

export default function Impressao3dPage() {
  if (!pillar) notFound();
  return <PillarPage pillar={pillar} extra={<PartViewer />} />;
}
