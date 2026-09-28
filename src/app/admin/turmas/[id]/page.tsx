import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCourses } from "@/lib/server/courses";
import { brasiliaInputParts } from "@/lib/format";
import { findCohort } from "@/lib/server/cohorts";
import { requireAdmin } from "@/lib/server/session";
import { removeCohort } from "../../_actions/cohorts";
import { CohortForm } from "../cohort-form";

export default async function EditCohortPage({
  params,
  searchParams,
}: PageProps<"/admin/turmas/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/turmas/${id}`);
  const query = await searchParams;
  const cohort = await findCohort(id);
  if (!cohort) notFound();
  const courses = await listCourses();

  const start = brasiliaInputParts(cohort.startsAt);
  const end = brasiliaInputParts(cohort.endsAt);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Editar turma
      </h1>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        {cohort.paid} paga(s) · {cohort.taken} vaga(s) ocupada(s) de{" "}
        {cohort.capacity} ·{" "}
        <Link
          href={`/admin/checkin?turma=${cohort.id}`}
          className="underline underline-offset-4"
        >
          lista de presença
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
        <CohortForm
          courses={courses.map(({ slug, title }) => ({ slug, title }))}
          lockedCourse={cohort.taken > 0}
          values={{
            id: cohort.id,
            courseId: cohort.courseId,
            label: cohort.label ?? "",
            date: start.date,
            startTime: start.time,
            endTime: end.time,
            venue: cohort.venue,
            address: cohort.address,
            price: (cohort.priceCents / 100).toFixed(2),
            capacity: String(cohort.capacity),
            lateRefundPercent: String(cohort.lateRefundPercent),
            lateRefundDaysBefore: String(cohort.lateRefundDaysBefore),
            status: cohort.status,
          }}
        />
      </div>

      {cohort.status === "draft" && cohort.taken === 0 ? (
        <form
          action={removeCohort}
          className="mt-12 border-t border-border pt-6"
        >
          <input type="hidden" name="id" value={cohort.id} />
          <Button type="submit" variant="destructive" className="h-11 px-4">
            <Trash2 aria-hidden />
            Apagar rascunho
          </Button>
        </form>
      ) : null}
    </div>
  );
}
