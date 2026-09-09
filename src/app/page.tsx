import { Hero } from "@/components/sections/hero";
import { Pillars } from "@/components/sections/pillars";
import { Process } from "@/components/sections/process";
import { EditoraBand } from "@/components/sections/editora-band";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Pillars />
      <Process />
      <EditoraBand />
      <Cta />
    </main>
  );
}
