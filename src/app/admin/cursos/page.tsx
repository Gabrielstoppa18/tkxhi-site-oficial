import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSE_PILLARS, courseHref, type CourseStatus } from "@/lib/courses";
import { listCourses } from "@/lib/server/courses";
import { requireAdmin } from "@/lib/server/session";

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "rascunho",
  published: "publicado",
  archived: "arquivado",
};

export default async function CoursesAdminPage({
  searchParams,
}: PageProps<"/admin/cursos">) {
  await requireAdmin("/admin/cursos");
  const query = await searchParams;
  const courses = await listCourses();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Cursos
        </h1>
        <Button asChild className="h-11 px-4">
          <Link href="/admin/cursos/novo">
            <Plus aria-hidden />
            Novo curso
          </Link>
        </Button>
      </div>
      <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
        O curso é o conteúdo: textos, programa e materiais. Data, local, preço e
        política de reembolso ficam na{" "}
        <Link href="/admin/turmas" className="underline underline-offset-4">
          turma
        </Link>
        .
      </p>

      {query.ok ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-primary pl-3 text-sm"
        >
          Curso salvo. O site já mostra a mudança.
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {courses.length === 0 ? (
          <li className="py-6 text-muted-foreground">
            Nenhum curso ainda. Crie o primeiro.
          </li>
        ) : null}
        {courses.map((course) => (
          <li
            key={course.slug}
            className={`${COURSE_PILLARS[course.pillar].colorClass} flex flex-wrap items-center gap-x-6 gap-y-2 py-4`}
          >
            <Link
              href={`/admin/cursos/${course.slug}`}
              className="min-w-0 flex-1 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="block font-medium">{course.title}</span>
              <span className="block font-mono text-xs text-muted-foreground">
                {COURSE_PILLARS[course.pillar].label} · {courseHref(course)} ·{" "}
                {course.modules.length} módulo(s)
              </span>
            </Link>
            <span
              data-status={course.status}
              className="border border-border px-2 py-1 font-mono text-xs tracking-wide uppercase data-[status=published]:border-primary data-[status=published]:text-primary"
            >
              {STATUS_LABEL[course.status]}
            </span>
            {course.status !== "draft" ? (
              <a
                href={courseHref(course)}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Ver no site
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
