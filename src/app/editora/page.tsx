import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { BookSeries } from "@/components/sections/book-series";
import { CoursesHighlight } from "@/components/sections/courses-highlight";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("editora");

// O destaque de cursos lê do banco: a página se atualiza a cada 5 minutos.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Editora",
  description: pillar?.summary,
  alternates: { canonical: "/editora" },
};

export default function EditoraPage() {
  if (!pillar) notFound();
  return (
    <PillarPage
      pillar={pillar}
      extra={
        <>
          <BookSeries />
          <CoursesHighlight
            pillar="editora"
            eyebrow="Cursos"
            title="Aprenda com quem publica."
            lead="Cursos presenciais ligados à editora, em turma pequena."
          />
        </>
      }
    />
  );
}
