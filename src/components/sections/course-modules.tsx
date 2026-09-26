import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import type { Course } from "@/lib/courses";

/** Os módulos como camadas numeradas: a ordem é a ordem de construção da peça. */
export function CourseModules({ course }: { course: Course }) {
  return (
    <section className="material-layered border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Programa"
          title={`${course.modules.length} módulos, da máquina à peça`}
          lead="Cada módulo prepara o seguinte, na mesma ordem em que uma impressão acontece."
        />
        <ol className="mt-10 grid border-t border-border/70 md:grid-cols-2 lg:grid-cols-4">
          {course.modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <li
                key={module.title}
                className="border-b border-border/70 bg-background/80 py-8 md:px-6 md:odd:border-r lg:border-r lg:border-b-0 lg:first:pl-0 lg:last:border-r-0"
              >
                <Reveal delay={index * 0.08}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
                      Camada {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon aria-hidden className="size-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                    {module.title}
                  </h3>
                  <p className="mt-3 text-pretty text-muted-foreground">
                    {module.description}
                  </p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
