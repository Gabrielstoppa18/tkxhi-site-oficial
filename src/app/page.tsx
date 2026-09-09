import { Hero } from "@/components/sections/hero";
import { Pillars } from "@/components/sections/pillars";
import { PartViewer } from "@/components/sections/part-viewer";
import { Process } from "@/components/sections/process";
import { Gallery } from "@/components/sections/gallery";
import { EditoraBand } from "@/components/sections/editora-band";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Pillars />
      <PartViewer />
      <Process />
      <Gallery />
      <EditoraBand />
      <Cta />
    </main>
  );
}
