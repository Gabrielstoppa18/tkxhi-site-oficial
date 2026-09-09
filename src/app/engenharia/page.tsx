import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("engenharia");

export const metadata: Metadata = {
  title: "Engenharia",
  description: pillar?.summary,
  alternates: { canonical: "/engenharia" },
};

export default function EngenhariaPage() {
  if (!pillar) notFound();
  return <PillarPage pillar={pillar} />;
}
