"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { courseBySlug } from "@/lib/courses";
import { audit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { sendRefundLinks } from "@/lib/server/email";
import {
  findEnrollment,
  findPaidByEmail,
  type Enrollment,
} from "@/lib/server/enrollments";
import { requestRefund } from "@/lib/server/refunds";
import { clientIp } from "@/lib/server/request";
import { consume, LIMITS } from "@/lib/server/rate-limit";
import { readRefundToken } from "@/lib/server/tokens";

/** Um pedido de link por matrícula a cada 5 minutos — segura quem tentar lotar a caixa de alguém. */
const LINK_COOLDOWN_MINUTES = 5;

/**
 * Aceita e-mail ou número da matrícula e sempre responde a mesma coisa: nunca
 * revela se há matrícula para aquele dado. O link vai só para o e-mail
 * cadastrado.
 */
export async function requestRefundLink(formData: FormData) {
  const lookup = String(formData.get("lookup") ?? "")
    .trim()
    .slice(0, 200);
  const ip = clientIp(await headers());

  // Mesmo estourado o limite, a resposta é a de sempre: não dá pista a quem sonda.
  if (!(await consume(`refund-link:ip:${ip}`, LIMITS.refundLinkIp))) {
    await audit({
      actor: "sistema",
      action: "rate_limited",
      ip,
      details: { route: "reembolso" },
    });
    redirect("/reembolso?enviado=1");
  }

  let found: Enrollment[] = [];
  if (lookup.includes("@")) {
    found = await findPaidByEmail(lookup);
  } else {
    const enrollment = await findEnrollment(lookup.toLowerCase());
    if (
      enrollment &&
      ["approved", "refunded"].includes(enrollment.payment_status)
    ) {
      found = [enrollment];
    }
  }

  if (found.length > 0) {
    const recent = await db()<{ enrollment_id: string }[]>`
      SELECT DISTINCT enrollment_id FROM audit_log
      WHERE action = 'refund_link_requested'
        AND enrollment_id IN ${db()(found.map((item) => item.id))}
        AND created_at > now() - make_interval(mins => ${LINK_COOLDOWN_MINUTES})
    `;
    const cooling = new Set(recent.map((row) => row.enrollment_id));
    const toSend = found.filter((item) => !cooling.has(item.id));

    if (toSend.length > 0) {
      await sendRefundLinks(
        toSend[0].buyer_email,
        toSend.map((enrollment) => ({
          enrollment,
          course: courseBySlug(enrollment.course_id),
        })),
      );
      for (const enrollment of toSend) {
        await audit({
          actor: "aluno",
          action: "refund_link_requested",
          enrollmentId: enrollment.id,
          ip,
          details: { lookup: lookup.includes("@") ? "email" : "matricula" },
        });
      }
    }
  }

  redirect("/reembolso?enviado=1");
}

export async function confirmRefundRequest(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const enrollmentId = readRefundToken(token);
  if (!enrollmentId) redirect("/reembolso?expirado=1");

  const result = await requestRefund(enrollmentId, clientIp(await headers()));
  redirect(`/reembolso/${token}?resultado=${result.kind}`);
}
