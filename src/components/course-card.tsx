import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  COURSE_PILLARS,
  courseHref,
  type Cohort,
  type Course,
} from "@/lib/courses";
import { formatBRL, formatDate } from "@/lib/format";
import { cn } from "cn";

/**
 * Cartão de um curso no catálogo e nos destaques. Leva a cor da frente, mas
 * não a textura: cartões ficam lado a lado, e dois painéis vizinhos com o
 * mesmo material leem como repetição (ver "Três materiais" no CLAUDE.md).
 * A textura aparece na página do curso.
 */
export function CourseCard({
  course,
  next,
  headingLevel = "h3",
}: {
  course: Course;
  next: Cohort | undefined;
  headingLevel?: "h2" | "h3";
}) {
  const style = COURSE_PILLARS[course.pillar];
  const Heading = headingLevel;

  return (
    <article
      className={cn(
        style.colorClass,
        "group relative flex h-full flex-col border border-border/70 bg-card",
      )}
    >
      <span aria-hidden className="h-1 w-full bg-primary" />
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
          {style.label} · Curso presencial
        </p>
        <Heading className="mt-4 font-display text-2xl font-bold tracking-tight text-balance">
          <Link
            href={courseHref(course)}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {course.title}
          </Link>
        </Heading>
        <p className="mt-2 font-medium text-primary">{course.tagline}</p>
        <p className="mt-3 flex-1 text-pretty text-muted-foreground">
          {course.lead}
        </p>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border/70 pt-4">
          <p className="font-mono text-xs leading-relaxed">
            {next ? (
              <>
                <span className="block text-muted-foreground uppercase">
                  Próxima turma
                </span>
                <span className="first-letter:uppercase">
                  {formatDate(next.startsAt)}
                </span>
                {" · "}
                {formatBRL(next.priceCents)}
              </>
            ) : (
              <span className="text-muted-foreground uppercase">
                Próxima turma em breve
              </span>
            )}
          </p>
          <ArrowRight
            aria-hidden
            className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </article>
  );
}
