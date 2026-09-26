import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { courseHref, type Course } from "@/lib/courses";

/** Chamada para o curso dentro da página da frente de Impressão 3D. */
export function CourseTeaser({ course }: { course: Course }) {
  return (
    <section className="material-layered border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <Reveal className="grid gap-8 bg-background/85 p-6 sm:p-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
              Curso presencial · com certificado
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {course.title}: {course.tagline}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
              {course.lead}
            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <Link
              href={courseHref(course)}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Conhecer o curso
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
