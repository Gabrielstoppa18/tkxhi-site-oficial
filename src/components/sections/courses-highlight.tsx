import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import type { CoursePillar } from "@/lib/courses";
import { nextOpenCohorts } from "@/lib/server/cohorts";
import { publishedCourses } from "@/lib/server/courses";

/**
 * Destaque dos cursos na home e nas páginas das frentes. Some sozinho quando
 * não há curso publicado — melhor nenhuma seção do que uma vazia.
 */
export async function CoursesHighlight({
  pillar,
  eyebrow = "Cursos",
  title = "Aprenda fazendo, com quem faz.",
  lead = "Cursos presenciais, em turmas pequenas, com o mesmo método que a TkxHi usa nos próprios projetos.",
  limit = 3,
}: {
  /** Só os cursos desta frente. Sem valor, mostra todos. */
  pillar?: CoursePillar;
  eyebrow?: string;
  title?: string;
  lead?: string;
  limit?: number;
}) {
  const all = await publishedCourses();
  const courses = (pillar ? all.filter((c) => c.pillar === pillar) : all).slice(
    0,
    limit,
  );
  if (courses.length === 0) return null;
  const next = await nextOpenCohorts();

  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
          </Reveal>
          <Link
            href="/cursos"
            className="inline-flex h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Ver todos os cursos
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <li key={course.slug}>
              <Reveal delay={index * 0.08} className="h-full">
                <CourseCard course={course} next={next.get(course.slug)} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
