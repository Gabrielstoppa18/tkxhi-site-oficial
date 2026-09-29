import { CircuitField } from "@/components/circuit-field";
import { ContactActions } from "@/components/contact-actions";
import { CourseCard } from "@/components/course-card";
import { Reveal } from "@/components/motion/reveal";
import type { Cohort, Course } from "@/lib/courses";

export function CoursesCatalog({
  courses,
  next,
}: {
  courses: Course[];
  next: Map<string, Cohort>;
}) {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <CircuitField className="[mask-image:radial-gradient(ellipse_75%_75%_at_50%_0%,black,transparent)] text-foreground/[0.07]" />
        <div className="mx-auto w-full max-w-6xl px-6 pt-20 pb-12 sm:pt-24">
          <Reveal className="max-w-3xl">
            <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
              Cursos presenciais
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.03em] uppercase">
              Aprenda fazendo
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-pretty">
              Turmas pequenas, bancada de verdade e o mesmo método que a TkxHi
              usa nos próprios projetos.
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
              Cada curso sai de uma das frentes da casa. Quem faz o check-in no
              dia recebe certificado de participação.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          {courses.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <li key={course.slug}>
                  <Reveal delay={Math.min(index, 5) * 0.06} className="h-full">
                    <CourseCard
                      course={course}
                      next={next.get(course.slug)}
                      headingLevel="h2"
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Novos cursos em breve
              </h2>
              <p className="mt-4 text-lg text-pretty text-muted-foreground">
                Estamos preparando as próximas turmas. Mande uma mensagem e
                avisamos quando as inscrições abrirem.
              </p>
              <ContactActions className="mt-8" />
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
