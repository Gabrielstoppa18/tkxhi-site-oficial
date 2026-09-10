import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { BookSeries } from "@/components/sections/book-series";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("editora");

export const metadata: Metadata = {
  title: "Editora",
  description: pillar?.summary,
  alternates: { canonical: "/editora" },
};

export default function EditoraPage() {
  if (!pillar) notFound();
  return <PillarPage pillar={pillar} extra={<BookSeries />} />;
}
