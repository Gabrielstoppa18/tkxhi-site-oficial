import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { COURSE_ICONS, COURSE_PILLARS, type Course } from "@/lib/courses";
import { cn } from "cn";

/**
 * Cada frente numera os módulos com a palavra do seu próprio processo: camada
 * na impressão, etapa no projeto, capítulo no livro.
 */
const STEP_LABEL = {
  "impressao-3d": "Camada",
  engenharia: "Etapa",
  editora: "Capítulo",
} as const;

export function CourseModules({ course }: { course: Course }) {
  const style = COURSE_PILLARS[course.pillar];
  const count = course.modules.length;

  return (
    <section className={cn(style.material, "border-t border-border/70")}>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Programa"
          title={`${count} ${count === 1 ? "módulo" : "módulos"}`}
          lead="Cada módulo prepara o seguinte: a ordem do programa é a ordem em que o trabalho acontece."
        />
        <ol className="mt-10 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {course.modules.map((module, index) => {
            const Icon = COURSE_ICONS[module.icon].icon;
            return (
              <li
                key={`${index}-${module.title}`}
                className="bg-background p-6"
              >
                <Reveal delay={Math.min(index, 4) * 0.08}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
                      {STEP_LABEL[course.pillar]}{" "}
                      {String(index + 1).padStart(2, "0")}
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
