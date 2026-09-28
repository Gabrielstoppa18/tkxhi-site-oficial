"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { courseHref } from "@/lib/courses";
import { findCourse } from "@/lib/server/courses";
import {
  createCohort,
  deleteCohort,
  findCohort,
  parseCohortForm,
  updateCohort,
} from "@/lib/server/cohorts";
import { isUuid } from "@/lib/server/enrollments";
import { requireAdmin } from "@/lib/server/session";

export type CohortFormState = { error: string | null };

/** A página pública é estática: toda mudança de turma pede uma nova versão dela. */
async function refreshPublic(courseId: string) {
  const course = await findCourse(courseId);
  if (course) revalidatePath(courseHref(course));
  // Catálogo, home e página da frente mostram a próxima turma.
  revalidatePath("/cursos");
  revalidatePath("/");
  revalidatePath("/impressao-3d");
  revalidatePath("/admin", "layout");
}

export async function saveCohort(
  _state: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  const principal = await requireAdmin("/admin/turmas");
  const parsed = await parseCohortForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const id = String(formData.get("id") ?? "");
  if (id) {
    if (!isUuid(id)) return { error: "Turma inválida." };
    const before = await findCohort(id);
    const result = await updateCohort(id, parsed.value, principal.actor);
    if (!result.ok) return { error: result.error };
    if (before && before.courseId !== parsed.value.courseId) {
      await refreshPublic(before.courseId);
    }
  } else {
    const result = await createCohort(parsed.value, principal.actor);
    if (!result.ok) return { error: result.error };
  }

  await refreshPublic(parsed.value.courseId);
  redirect("/admin/turmas?ok=1");
}

export async function removeCohort(formData: FormData) {
  const principal = await requireAdmin("/admin/turmas");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) throw new Error("Turma inválida.");
  const cohort = await findCohort(id);
  const result = await deleteCohort(id, principal.actor);
  if (cohort) await refreshPublic(cohort.courseId);
  redirect(
    result.ok
      ? "/admin/turmas?ok=1"
      : `/admin/turmas/${id}?erro=${encodeURIComponent(result.error)}`,
  );
}
