import { currentYear } from "@/lib/format";
import { requireAdmin } from "@/lib/server/session";
import { CourseForm } from "../course-form";

export default async function NewCoursePage() {
  await requireAdmin("/admin/cursos/novo");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Novo curso
      </h1>
      <p className="mt-2 text-muted-foreground">
        Comece como rascunho, confira e publique. Depois, crie a turma com data,
        local e preço.
      </p>
      <div className="mt-8">
        <CourseForm defaultEdition={currentYear()} />
      </div>
    </div>
  );
}
