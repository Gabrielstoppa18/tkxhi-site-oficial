import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { CoursesHighlight } from "@/components/sections/courses-highlight";
import { PartViewer } from "@/components/sections/part-viewer";
import { pillarBySlug } from "@/lib/content";

const pillar = pillarBySlug("impressao-3d");

// O destaque de cursos lê do banco: a página se atualiza a cada 5 minutos.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Impressão 3D",
  description: pillar?.summary,
  alternates: { canonical: "/impressao-3d" },
};

export default function Impressao3dPage() {
  if (!pillar) notFound();
  return (
    <PillarPage
      pillar={pillar}
      extra={
        <>
          <PartViewer />
          <CoursesHighlight
            pillar="impressao-3d"
            eyebrow="Cursos de impressão 3D"
            title="Aprenda a imprimir com quem imprime."
            lead="Da anatomia da impressora ao fatiamento, em turma pequena e com a máquina na frente."
          />
        </>
      }
    />
  );
}
