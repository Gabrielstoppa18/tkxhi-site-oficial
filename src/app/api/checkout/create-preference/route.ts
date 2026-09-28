import { CONSENT_VERSION, consentText } from "@/lib/consent";
import { courseHref } from "@/lib/courses";
import { findCourse } from "@/lib/server/courses";
import { normalizeCpf } from "@/lib/cpf";
import { audit } from "@/lib/server/audit";
import { findCohort } from "@/lib/server/cohorts";
import { encrypt } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import {
  hasApprovedEnrollment,
  PENDING_HOLD_MINUTES,
  seatsTaken,
  supersedePending,
} from "@/lib/server/enrollments";
import { appUrl } from "@/lib/server/env";
import { createPreference } from "@/lib/server/mercadopago";
import { consume, LIMITS } from "@/lib/server/rate-limit";
import { clientIp, userAgent } from "@/lib/server/request";
import { createOpaqueToken } from "@/lib/server/tokens";

/**
 * Cria a matrícula como `pending`, com a ciência gravada, e a preferência no
 * Mercado Pago. Responde com a URL do checkout; o formulário redireciona.
 *
 * Erros saem como { error, field? } para o formulário mostrar ao lado do campo.
 */
type Body = {
  cohortId?: unknown;
  name?: unknown;
  email?: unknown;
  cpf?: unknown;
  consent?: unknown;
  consentVersion?: unknown;
};

function fail(error: string, status = 400, field?: string) {
  return Response.json({ error, field }, { status });
}

export async function POST(request: Request) {
  // Formulário do próprio site: rejeita chamadas de outra origem.
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(appUrl()).origin &&
    origin !== new URL(request.url).origin
  ) {
    return fail("Origem não permitida.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return fail("Requisição inválida.", 415);
  }

  const ip = clientIp(request.headers);
  if (!(await consume(`checkout:ip:${ip}`, LIMITS.checkoutIp))) {
    await audit({
      actor: "sistema",
      action: "rate_limited",
      ip,
      details: { route: "checkout" },
    });
    return fail(
      "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
      429,
    );
  }

  const raw = await request.text();
  if (raw.length > 4_000) return fail("Requisição grande demais.", 413);
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return fail("Requisição inválida.");
  }

  const cohort =
    typeof body.cohortId === "string" ? await findCohort(body.cohortId) : null;
  const course = cohort ? await findCourse(cohort.courseId) : undefined;
  if (!cohort || !course || cohort.status !== "open") {
    return fail("As inscrições desta turma não estão abertas.", 404);
  }
  if (Date.parse(cohort.startsAt) <= Date.now()) {
    return fail("As inscrições desta turma já foram encerradas.", 409);
  }

  const name =
    typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (
    name.length < 3 ||
    name.length > 120 ||
    !name.includes(" ") ||
    /[<>{}\\]|[\u0000-\u001f]/.test(name)
  ) {
    return fail(
      "Informe o nome completo, como vai sair no certificado.",
      400,
      "name",
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 200) {
    return fail("Informe um e-mail válido.", 400, "email");
  }

  const cpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : null;
  if (!cpf) return fail("CPF inválido. Confira os números.", 400, "cpf");

  // A ciência tem de ser um `true` explícito, e da versão do texto que o
  // servidor mostraria agora — um formulário aberto antes de uma mudança de
  // redação precisa ser recarregado.
  if (body.consent !== true) {
    return fail("Marque a caixa de ciência para continuar.", 400, "consent");
  }
  if (body.consentVersion !== CONSENT_VERSION) {
    return fail(
      "As condições da matrícula foram atualizadas. Recarregue a página e leia de novo antes de continuar.",
      409,
      "consent",
    );
  }

  if (await hasApprovedEnrollment(cohort.id, email, name)) {
    return fail(
      "Esta pessoa já está matriculada nesta turma. Para matricular outra pessoa com o mesmo e-mail, use o nome dela.",
      409,
      "name",
    );
  }
  // Tentativas anteriores deste e-mail nesta turma ficam substituídas pela
  // nova — antes de contar vagas, para a própria tentativa antiga não barrar.
  for (const previous of await supersedePending(cohort.id, email, name)) {
    await audit({
      actor: "sistema",
      action: "enrollment_superseded",
      enrollmentId: previous,
      ip,
      details: { reason: "nova tentativa de pagamento do mesmo e-mail" },
    });
  }

  if ((await seatsTaken(cohort.id)) >= cohort.capacity) {
    return fail(
      "As vagas desta turma acabaram. Fale com a gente para entrar na lista de espera.",
      409,
    );
  }

  const text = consentText(course, cohort);

  const [enrollment] = await db()<{ id: string }[]>`
    INSERT INTO enrollments (
      course_id, cohort_id, buyer_name, buyer_email, buyer_cpf_enc,
      amount_cents, late_refund_percent, late_refund_days_before,
      consent_text, consent_version, consent_timestamp, consent_ip, consent_user_agent,
      checkin_token, certificate_token
    ) VALUES (
      ${course.slug}, ${cohort.id}, ${name}, ${email}, ${encrypt(cpf, "cpf")},
      ${cohort.priceCents}, ${cohort.lateRefundPercent}, ${cohort.lateRefundDaysBefore},
      ${text}, ${CONSENT_VERSION}, now(), ${ip}, ${userAgent(request.headers)},
      ${createOpaqueToken()}, ${createOpaqueToken()}
    )
    RETURNING id
  `;

  await audit({
    actor: "aluno",
    action: "enrollment_created",
    enrollmentId: enrollment.id,
    ip,
    details: {
      course: course.slug,
      cohortId: cohort.id,
      amountCents: cohort.priceCents,
      consentVersion: CONSENT_VERSION,
    },
  });

  try {
    const preference = await createPreference({
      enrollmentId: enrollment.id,
      courseSlug: course.slug,
      title: `Curso ${course.title} — ${course.edition}`,
      amountCents: cohort.priceCents,
      buyer: { name, email, cpf },
      backUrl: `${appUrl()}${courseHref(course)}/confirmacao?matricula=${enrollment.id}`,
      expiresAt: new Date(Date.now() + PENDING_HOLD_MINUTES * 60_000),
    });

    await db()`
      UPDATE enrollments SET mp_preference_id = ${preference.id}
      WHERE id = ${enrollment.id}
    `;
    await audit({
      actor: "sistema",
      action: "preference_created",
      enrollmentId: enrollment.id,
      details: { preferenceId: preference.id },
    });

    // Só redireciona para o domínio do Mercado Pago.
    const target = new URL(preference.init_point);
    if (
      target.protocol !== "https:" ||
      !/(^|\.)mercadopago\.com(\.br)?$/.test(target.hostname)
    ) {
      throw new Error(`init_point inesperado: ${target.hostname}`);
    }
    return Response.json({ url: target.toString() });
  } catch (error) {
    console.error(
      "Falha ao criar preferência",
      enrollment.id,
      error instanceof Error ? error.message : error,
    );
    // Sem preferência não há pagamento possível: libera a vaga na hora.
    await db()`
      UPDATE enrollments SET payment_status = 'cancelled' WHERE id = ${enrollment.id}
    `;
    return fail(
      "Não conseguimos abrir o pagamento agora. Tente de novo em alguns minutos.",
      502,
    );
  }
}
