import Link from "next/link";
import { listCourses } from "@/lib/server/courses";
import { requireAdmin } from "@/lib/server/session";
import { CohortForm } from "../cohort-form";

export default async function NewCohortPage() {
  await requireAdmin("/admin/turmas/nova");
  // Turma só para curso ativo; arquivado não recebe turma nova.
  const courses = (await listCourses()).filter(
    (course) => course.status !== "archived",
  );
  if (courses.length === 0) {
    return (
      <p className="text-muted-foreground">
        Cadastre um curso antes de criar a turma.{" "}
        <Link
          href="/admin/cursos/novo"
          className="underline underline-offset-4"
        >
          Novo curso
        </Link>
      </p>
    );
  }

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
            lateRefundPercent: "",
            lateRefundDaysBefore: "",
            status: "draft",
          }}
        />
      </div>
    </div>
  );
}
