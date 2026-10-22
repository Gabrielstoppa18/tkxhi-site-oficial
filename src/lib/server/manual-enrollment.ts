import "server-only";
import { revalidatePath } from "next/cache";
import { courseHref } from "@/lib/courses";
import { normalizeCpf } from "@/lib/cpf";
import { normalizePhone } from "@/lib/phone";
import { audit } from "@/lib/server/audit";
import { findCohort } from "@/lib/server/cohorts";
import { findCourse } from "@/lib/server/courses";
import { encrypt } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import {
  findEnrollment,
  hasApprovedEnrollment,
  isUuid,
  seatsTaken,
} from "@/lib/server/enrollments";
import { ensureConfirmationSent } from "@/lib/server/payments";
import { createOpaqueToken } from "@/lib/server/tokens";

/** Versão do "texto de ciência" das matrículas feitas pelo painel. */
export const MANUAL_CONSENT_VERSION = "painel";

export type ManualEnrollmentInput = {
  cohortId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  amount: string;
  partner: string;
  sendEmail: boolean;
};

/**
 * Matrícula cadastrada pela equipe (parceria, cortesia, pagamento por fora).
 *
 * - Entra já paga, sem passar pelo Mercado Pago: não tem reembolso automático
 *   — devolver dinheiro de parceria é combinado com a parceria.
 * - O aluno não aceitou as condições online. O registro de ciência diz isso
 *   com todas as letras, e quem cadastrou fica no lugar do IP.
 * - Mesmas proteções do site: o mesmo aluno não entra duas vezes e a turma
 *   não passa das vagas (aumente as vagas da turma se precisar).
 */
export async function createManualEnrollment(
  input: ManualEnrollmentInput,
  admin: { actor: string; ip: string; userAgent: string | null },
): Promise<
  { ok: true; id: string; emailSent: boolean } | { ok: false; error: string }
> {
  if (!isUuid(input.cohortId)) return { ok: false, error: "Turma inválida." };
  const cohort = await findCohort(input.cohortId);
  const course = cohort ? await findCourse(cohort.courseId) : undefined;
  if (!cohort || !course) return { ok: false, error: "Turma não encontrada." };
  if (cohort.status === "cancelled") {
    return { ok: false, error: "Turma cancelada não recebe matrícula." };
  }

  const name = input.name.trim().replace(/\s+/g, " ");
  if (
    name.length < 3 ||
    name.length > 120 ||
    !name.includes(" ") ||
    /[<>{}\\]|[\u0000-\u001f]/.test(name)
  ) {
    return {
      ok: false,
      error: "Informe o nome completo do aluno (vai no certificado).",
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 200) {
    return { ok: false, error: "Informe um e-mail válido." };
  }

  let phone: string | null = null;
  if (input.phone.trim()) {
    phone = normalizePhone(input.phone);
    if (!phone)
      return { ok: false, error: "Telefone inválido. Use DDD + número." };
  }

  let cpf: string | null = null;
  if (input.cpf.trim()) {
    cpf = normalizeCpf(input.cpf);
    if (!cpf)
      return {
        ok: false,
        error: "CPF inválido. Deixe em branco se não tiver.",
      };
  }

  const reais = Number(input.amount.trim().replace(",", ".") || "0");
  const amountCents = Math.round(reais * 100);
  if (!Number.isFinite(reais) || amountCents < 0 || amountCents > 10_000_00) {
    return {
      ok: false,
      error: "Valor pago entre R$ 0 (cortesia) e R$ 10.000.",
    };
  }

  const partner = input.partner.trim().replace(/\s+/g, " ").slice(0, 120);
  if (partner.length < 2) {
    return { ok: false, error: "Informe a parceria ou o motivo da matrícula." };
  }

  if (await hasApprovedEnrollment(cohort.id, email, name)) {
    return { ok: false, error: "Este aluno já está matriculado nesta turma." };
  }
  if ((await seatsTaken(cohort.id)) >= cohort.capacity) {
    return {
      ok: false,
      error:
        "A turma está cheia. Aumente as vagas da turma antes de matricular.",
    };
  }

  const consentText =
    `Matrícula cadastrada pela equipe no painel (${admin.actor}). ` +
    `Parceria ou motivo: ${partner}. ` +
    "O aluno não aceitou as condições pelo site.";

  const [row] = await db()<{ id: string }[]>`
    INSERT INTO enrollments (
      course_id, cohort_id, buyer_name, buyer_email, buyer_cpf_enc, buyer_phone_enc,
      amount_cents, late_refund_percent, late_refund_days_before,
      payment_status, paid_at, source, partner,
      consent_text, consent_version, consent_timestamp, consent_ip, consent_user_agent,
      checkin_token, certificate_token
    ) VALUES (
      ${course.slug}, ${cohort.id}, ${name}, ${email},
      ${cpf ? encrypt(cpf, "cpf") : null}, ${phone ? encrypt(phone, "phone") : null},
      ${amountCents}, ${cohort.lateRefundPercent}, ${cohort.lateRefundDaysBefore},
      'approved', now(), 'admin', ${partner},
      ${consentText}, ${MANUAL_CONSENT_VERSION}, now(), ${admin.ip}, ${admin.userAgent},
      ${createOpaqueToken()}, ${createOpaqueToken()}
    )
    RETURNING id
  `;

  await audit({
    actor: admin.actor,
    action: "enrollment_created",
    enrollmentId: row.id,
    ip: admin.ip,
    details: {
      source: "admin",
      course: course.slug,
      cohortId: cohort.id,
      partner,
      amountCents,
      hasCpf: Boolean(cpf),
      hasPhone: Boolean(phone),
    },
  });

  try {
    revalidatePath(courseHref(course));
  } catch {
    // Melhor esforço: a página do curso se refaz na revalidação periódica.
  }

  let emailSent = false;
  if (input.sendEmail) {
    const enrollment = await findEnrollment(row.id);
    if (enrollment) {
      emailSent =
        (await ensureConfirmationSent(enrollment, admin.actor)) === "sent";
    }
  }
  return { ok: true, id: row.id, emailSent };
}
