import { courses, DEFAULT_REFUND_POLICY } from "@/lib/courses";
import { requireAdmin } from "@/lib/server/session";
import { CohortForm } from "../cohort-form";

export default async function NewCohortPage() {
  await requireAdmin("/admin/turmas/nova");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Nova turma
      </h1>
      <p className="mt-2 text-muted-foreground">
        Comece como rascunho, confira os dados e depois mude para “aberta”.
      </p>
      <div className="mt-8">
        <CohortForm
          courses={courses.map(({ slug, title }) => ({ slug, title }))}
          lockedCourse={false}
          values={{
            courseId: courses[0].slug,
            label: "",
            date: "",
            startTime: "08:00",
            endTime: "17:00",
            venue: "",
            address: "",
            price: "",
            capacity: "12",
            lateRefundPercent: String(DEFAULT_REFUND_POLICY.lateRefundPercent),
            lateRefundDaysBefore: String(
              DEFAULT_REFUND_POLICY.lateRefundDaysBefore,
            ),
            status: "draft",
          }}
        />
      </div>
    </div>
  );
}
