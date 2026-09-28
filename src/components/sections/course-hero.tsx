import { ArrowDown } from "lucide-react";
import { CircuitField } from "@/components/circuit-field";
import { Reveal } from "@/components/motion/reveal";
import { PhotoPlate } from "@/components/photo-plate";
import { Button } from "@/components/ui/button";
import {
  cohortHours,
  COURSE_PILLARS,
  type Cohort,
  type Course,
} from "@/lib/courses";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { photos } from "@/lib/photos";

/** `next` é a turma aberta mais próxima, ou null se nenhuma estiver à venda. */
export function CourseHero({
  course,
  next,
}: {
  course: Course;
  next: Cohort | null;
}) {
  const facts = next
    ? [
        { label: "Próxima turma", value: formatDate(next.startsAt) },
        {
          label: "Horário",
          value: `${formatTime(next.startsAt)}–${formatTime(next.endsAt)} · ${cohortHours(next)} h`,
        },
        { label: "Local", value: next.venue },
        { label: "Investimento", value: formatBRL(next.priceCents) },
      ]
    : [{ label: "Próxima turma", value: "Data em definição" }];

  return (
    <section className="relative isolate overflow-hidden">
      <CircuitField className="[mask-image:radial-gradient(ellipse_75%_75%_at_50%_0%,black,transparent)] text-foreground/[0.07]" />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-20 pb-16 sm:pt-24 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-7">
          <p className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
            Curso presencial · Edição {course.edition}
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.03em] uppercase">
            {course.title}
          </h1>
          <p className="mt-6 text-2xl font-medium text-primary sm:text-3xl">
            {course.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
            {course.lead}
          </p>
          <p className="mt-6 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Por {course.authors}
          </p>

          <dl className="mt-10 grid border-t border-border/70 sm:grid-cols-2">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="border-b border-border/70 py-4 sm:odd:pr-6"
              >
                <dt className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-lg first-letter:uppercase">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <Button asChild size="lg" className="mt-8 h-11 px-5">
            <a href="#matricula">
              {next ? "Garantir minha vaga" : "Quero ser avisado"}
              <ArrowDown aria-hidden />
            </a>
          </Button>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-5">
          <PhotoPlate
            src={photos[course.photo].src}
            alt={photos[course.photo].alt}
            annotation={`${COURSE_PILLARS[course.pillar].label} · ${course.title}`}
            priority
          />
        </Reveal>
      </div>
    </section>
  );
}
