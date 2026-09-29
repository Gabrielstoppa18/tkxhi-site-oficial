"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { courseHref } from "@/lib/courses";
import {
  createCourse,
  deleteCourse,
  parseCourseForm,
  updateCourse,
} from "@/lib/server/courses";
import { requireAdmin } from "@/lib/server/session";

export type CourseFormState = { error: string | null };

/** Páginas públicas que mostram cursos são estáticas: pedem versão nova. */
function refreshPublic(slug: string) {
  revalidatePath(courseHref({ slug }));
  revalidatePath("/cursos");
  revalidatePath("/");
  revalidatePath("/impressao-3d");
  revalidatePath("/engenharia");
  revalidatePath("/editora");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin", "layout");
}

export async function saveCourse(
  _state: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const principal = await requireAdmin("/admin/cursos");
  const parsed = parseCourseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const existing = String(formData.get("existingSlug") ?? "");
  const result = existing
    ? await updateCourse(existing, parsed.value, principal.actor)
    : await createCourse(parsed.value, principal.actor);
  if (!result.ok) return { error: result.error };

  refreshPublic(existing || parsed.value.slug);
  redirect("/admin/cursos?ok=1");
}

export async function removeCourse(formData: FormData) {
  const principal = await requireAdmin("/admin/cursos");
  const slug = String(formData.get("slug") ?? "");
  const result = await deleteCourse(slug, principal.actor);
  refreshPublic(slug);
  redirect(
    result.ok
      ? "/admin/cursos?ok=1"
      : `/admin/cursos/${encodeURIComponent(slug)}?erro=${encodeURIComponent(result.error)}`,
  );
}
