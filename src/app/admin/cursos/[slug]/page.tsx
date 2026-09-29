import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentYear } from "@/lib/format";
import { listCohorts } from "@/lib/server/cohorts";
import { findCourse } from "@/lib/server/courses";
import { requireAdmin } from "@/lib/server/session";
import { removeCourse } from "../../_actions/courses";
import { CourseForm } from "../course-form";

export default async function EditCoursePage({
  params,
  searchParams,
}: PageProps<"/admin/cursos/[slug]">) {
  const { slug } = await params;
  await requireAdmin(`/admin/cursos/${slug}`);
  const query = await searchParams;
  const course = await findCourse(slug);
  if (!course) notFound();
  const cohorts = (await listCohorts()).filter(
    (item) => item.courseId === course.slug,
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {course.title}
      </h1>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        {cohorts.length} turma(s) ·{" "}
        <Link href="/admin/turmas" className="underline underline-offset-4">
          gerenciar turmas
        </Link>
      </p>

      {typeof query.erro === "string" ? (
        <p
          role="alert"
          className="mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
        >
          {query.erro}
        </p>
      ) : null}

      <div className="mt-8">
        <CourseForm course={course} defaultEdition={currentYear()} />
      </div>

      {course.status === "draft" && cohorts.length === 0 ? (
        <form
          action={removeCourse}
          className="mt-12 border-t border-border pt-6"
        >
          <input type="hidden" name="slug" value={course.slug} />
          <Button type="submit" variant="destructive" className="h-11 px-4">
            <Trash2 aria-hidden />
            Apagar rascunho
          </Button>
        </form>
      ) : null}
    </div>
  );
}
