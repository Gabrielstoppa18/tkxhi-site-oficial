import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { TurtleT } from "@/components/sections/turtle-t";
import { CoursesHighlight } from "@/components/sections/courses-highlight";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("engenharia");

// O destaque de cursos lê do banco: a página se atualiza a cada 5 minutos.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Engenharia",
  description: pillar?.summary,
  alternates: { canonical: "/engenharia" },
};

export default function EngenhariaPage() {
  if (!pillar) notFound();
  return (
    <PillarPage
      pillar={pillar}
      extra={
        <>
          <TurtleT />
          <CoursesHighlight
            pillar="engenharia"
            eyebrow="Cursos"
            title="Aprenda a projetar com quem projeta."
            lead="Cursos presenciais de engenharia, em turma pequena e com o projeto na bancada."
          />
        </>
      }
    />
  );
}
