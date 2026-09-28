"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findCourse } from "@/lib/server/courses";
import { audit } from "@/lib/server/audit";
import { findCohort } from "@/lib/server/cohorts";
import { db } from "@/lib/server/db";
import { sendCertificate } from "@/lib/server/email";
import {
  findEnrollment,
  isActive,
  isUuid,
  type Enrollment,
} from "@/lib/server/enrollments";
import { ensureConfirmationSent } from "@/lib/server/payments";
import { clientIp } from "@/lib/server/request";
import { requireAdmin } from "@/lib/server/session";

function uuidFrom(formData: FormData, name: string): string {
  const id = String(formData.get(name) ?? "");
  if (!isUuid(id)) throw new Error("Identificador inválido.");
  return id;
}

/** Marca presença. Só vale para matrícula ativa e ainda sem check-in. */
export async function confirmCheckin(formData: FormData) {
  const principal = await requireAdmin();
  const id = uuidFrom(formData, "enrollmentId");
  const via = formData.get("via") === "qr" ? "qr" : "lista";

  const [updated] = await db()<Enrollment[]>`
    UPDATE enrollments SET
      attendance_confirmed = true,
      attendance_timestamp = now(),
      attendance_by = ${principal.actor}
    WHERE id = ${id}
      AND payment_status = 'approved'
      AND refund_status NOT IN ('auto_approved', 'approved')
      AND attendance_confirmed = false
    RETURNING *
  `;
  if (updated) {
    await audit({
      actor: principal.actor,
      action: "checkin_confirmed",
      enrollmentId: id,
      ip: clientIp(await headers()),
      details: { via },
    });
  }
  revalidatePath("/admin", "layout");
}

/** Desfaz um check-in marcado por engano. Fica registrado na auditoria. */
export async function undoCheckin(formData: FormData) {
  const principal = await requireAdmin();
  const id = uuidFrom(formData, "enrollmentId");

  const [previous] = await db()<Pick<Enrollment, "attendance_timestamp">[]>`
    SELECT attendance_timestamp FROM enrollments WHERE id = ${id}
  `;
  const [updated] = await db()`
    UPDATE enrollments SET
      attendance_confirmed = false,
      attendance_timestamp = NULL,
      attendance_by = NULL
    WHERE id = ${id} AND attendance_confirmed = true
    RETURNING id
  `;
  if (updated) {
    await audit({
      actor: principal.actor,
      action: "checkin_undone",
      enrollmentId: id,
      ip: clientIp(await headers()),
      details: { previousTimestamp: previous?.attendance_timestamp },
    });
  }
  revalidatePath("/admin", "layout");
}

export async function sendCertificates(formData: FormData) {
  const principal = await requireAdmin();
  const cohort = await findCohort(uuidFrom(formData, "cohortId"));
  const course = cohort ? await findCourse(cohort.courseId) : undefined;
  if (!cohort || !course) throw new Error("Turma inválida.");

  const attended = await db()<Enrollment[]>`
    SELECT * FROM enrollments
    WHERE cohort_id = ${cohort.id}
      AND attendance_confirmed = true
      AND payment_status = 'approved'
      AND refund_status NOT IN ('auto_approved', 'approved')
  `;
  let sent = 0;
  for (const enrollment of attended) {
    if (!(await sendCertificate(enrollment, course))) continue;
    sent++;
    await audit({
      actor: principal.actor,
      action: "certificate_email_sent",
      enrollmentId: enrollment.id,
      details: { to: enrollment.buyer_email },
    });
  }
  redirect(
    `/admin/checkin?turma=${cohort.id}&certificados=${sent}&falhas=${attended.length - sent}`,
  );
}

/** Reenvia o e-mail com data, local e QR code — para quem não recebeu. */
export async function resendConfirmation(formData: FormData) {
  const principal = await requireAdmin();
  const enrollment = await findEnrollment(uuidFrom(formData, "enrollmentId"));
  if (!enrollment || !isActive(enrollment)) {
    throw new Error("Matrícula sem pagamento ativo.");
  }
  const result = await ensureConfirmationSent(enrollment, principal.actor, {
    force: true,
  });
  redirect(
    `/admin/checkin?turma=${enrollment.cohort_id}&confirmacao=${result === "sent" ? "ok" : "falha"}`,
  );
}
