import { Hero } from "@/components/sections/hero";
import { Pillars } from "@/components/sections/pillars";
import { PartViewer } from "@/components/sections/part-viewer";
import { Process } from "@/components/sections/process";
import { Orbit } from "@/components/sections/orbit";
import { CoursesHighlight } from "@/components/sections/courses-highlight";
import { EditoraBand } from "@/components/sections/editora-band";
import { Cta } from "@/components/sections/cta";

// Continua estática; o destaque de cursos se atualiza a cada 5 minutos e
// sempre que um curso ou turma é editado no painel.
export const revalidate = 300;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Pillars />
      <PartViewer />
      <Process />
      <Orbit />
      <CoursesHighlight />
      <EditoraBand />
      <Cta />
    </main>
  );
}
