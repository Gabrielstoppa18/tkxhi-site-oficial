import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CohortStatus } from "@/lib/courses";
import { courseTitles } from "@/lib/server/courses";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { listCohorts } from "@/lib/server/cohorts";
import { requireAdmin } from "@/lib/server/session";

const STATUS_LABEL: Record<CohortStatus, string> = {
  draft: "rascunho",
  open: "aberta",
  closed: "fechada",
  cancelled: "cancelada",
};

export default async function CohortsPage({
  searchParams,
}: PageProps<"/admin/turmas">) {
  await requireAdmin("/admin/turmas");
  const titles = await courseTitles();
  const query = await searchParams;
  const cohorts = await listCohorts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Turmas
        </h1>
        <Button asChild className="h-11 px-4">
          <Link href="/admin/turmas/nova">
            <Plus aria-hidden />
            Nova turma
          </Link>
        </Button>
      </div>

      {query.ok ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-primary pl-3 text-sm"
        >
          Turma salva. A página do curso já mostra a mudança.
        </p>
      ) : null}

      {cohorts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Nenhuma turma ainda. Crie a primeira para abrir as inscrições.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {cohorts.map((cohort) => (
            <li key={cohort.id}>
              <Link
                href={`/admin/turmas/${cohort.id}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium first-letter:uppercase">
                    {formatDate(cohort.startsAt)}, {formatTime(cohort.startsAt)}
                    {cohort.label ? ` · ${cohort.label}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {titles.get(cohort.courseId) ?? cohort.courseId} ·{" "}
                    {cohort.venue} · {formatBRL(cohort.priceCents)}
                  </p>
                </div>
                <span className="font-mono text-sm">
                  {cohort.paid}/{cohort.capacity} pagas
                </span>
                <span
                  data-status={cohort.status}
                  className="border border-border px-2 py-1 font-mono text-xs tracking-wide uppercase data-[status=open]:border-primary data-[status=open]:text-primary"
                >
                  {STATUS_LABEL[cohort.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
