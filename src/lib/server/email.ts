import "server-only";
import QRCode from "qrcode";
import type { Cohort, Course } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";
import {
  formatBRL,
  formatCpf,
  formatDate,
  formatDateTime,
  formatTime,
} from "@/lib/format";
import { audit, type AuditEntry } from "@/lib/server/audit";
import { buyerCpf, type Enrollment } from "@/lib/server/enrollments";
import { appUrl, env } from "@/lib/server/env";
import { createRefundToken } from "@/lib/server/tokens";

/**
 * E-mails transacionais pela API do Resend. Sem RESEND_API_KEY, a mensagem é
 * impressa no console — dá para testar o fluxo inteiro em desenvolvimento sem
 * conta de e-mail.
 *
 * E-mail não lê CSS externo nem variáveis: as cores aqui são as da marca em
 * hex, inline, e o layout é uma coluna só.
 */
type Attachment = { filename: string; content: Buffer };

async function send(message: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
  idempotencyKey?: string;
}): Promise<void> {
  const apiKey = env.resendApiKey();
  if (!apiKey) {
    console.info(
      `\n[e-mail não enviado: RESEND_API_KEY ausente]\nPara: ${message.to}\nAssunto: ${message.subject}\n\n${message.text}\n`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(message.idempotencyKey
        ? { "Idempotency-Key": message.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from: env.emailFrom(),
      to: message.to,
      reply_to: siteConfig.contact.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((item) => ({
        filename: item.filename,
        content: item.content.toString("base64"),
      })),
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Resend respondeu ${response.status}: ${await response.text()}`,
    );
  }
}

/**
 * Envio de aviso (reembolso, alerta, certificado): nunca lança. Um e-mail que
 * não sai não pode desfazer o que já aconteceu — um reembolso processado não
 * vira "reembolso falhou" porque o Resend recusou a mensagem. A falha fica na
 * auditoria e quem chamou recebe `false`.
 */
async function trySend(message: Parameters<typeof send>[0]): Promise<boolean> {
  try {
    await send(message);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Falha ao enviar e-mail", message.subject, detail);
    await audit({
      actor: "sistema",
      action: "email_failed",
      details: {
        subject: message.subject,
        to: message.to,
        error: detail.slice(0, 500),
      },
    }).catch(() => {});
    return false;
  }
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Moldura comum: paleta da marca, texto escuro sobre claro para ler em qualquer cliente. */
function layout(title: string, body: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4eff8;font-family:Arial,Helvetica,sans-serif;color:#190630">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-top:6px solid #fe7c20">
<tr><td style="padding:28px 28px 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#6b5a7d">${escape(siteConfig.name)}</td></tr>
<tr><td style="padding:0 28px;font-size:24px;font-weight:bold;line-height:1.25">${escape(title)}</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:16px;line-height:1.55">${body}</td></tr>
<tr><td style="padding:16px 28px;background:#190630;color:#d9cfe3;font-size:12px;line-height:1.5">
${escape(siteConfig.name)} · CNPJ ${escape(siteConfig.cnpj)} · Dúvidas? Responda este e-mail ou escreva para ${escape(siteConfig.contact.email)}.
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escape(href)}" style="display:inline-block;background:#cd5d01;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px">${escape(label)}</a></p>`;
}

function paragraphs(lines: string[]): string {
  return lines.map((line) => `<p style="margin:0 0 12px">${line}</p>`).join("");
}

export function refundLinkFor(enrollmentId: string): string {
  return `${appUrl()}/reembolso/${createRefundToken(enrollmentId)}`;
}

export function certificateLinkFor(
  enrollment: Pick<Enrollment, "certificate_token">,
): string {
  return `${appUrl()}/certificado/${enrollment.certificate_token}`;
}

export async function sendEnrollmentConfirmation(
  enrollment: Enrollment,
  course: Course,
  cohort: Cohort,
  /** Muda a cada tentativa: o Resend guarda a resposta de uma chave, inclusive a de erro. */
  idempotencyKey = `confirmation-${enrollment.id}`,
): Promise<void> {
  const checkinUrl = `${appUrl()}/admin/checkin/${enrollment.checkin_token}`;
  const qr = await QRCode.toBuffer(checkinUrl, { width: 480, margin: 2 });
  const qrSrc = `${appUrl()}/api/checkin/qr/${enrollment.checkin_token}`;

  const when = `${formatDate(cohort.startsAt)}, das ${formatTime(cohort.startsAt)} às ${formatTime(cohort.endsAt)}`;
  const where = `${cohort.venue} — ${cohort.address}`;

  const text = [
    `Olá, ${enrollment.buyer_name}!`,
    `Sua matrícula no curso ${course.title} está confirmada.`,
    `Quando: ${when}`,
    `Onde: ${where}`,
    `Matrícula: ${enrollment.id}`,
    "No dia, apresente o QR code anexado a este e-mail na entrada. Ele é o registro da sua presença e é pessoal.",
    `Precisa desistir? Você pode pedir o reembolso em ${appUrl()}/reembolso.`,
  ].join("\n\n");

  await send({
    to: enrollment.buyer_email,
    subject: `Matrícula confirmada — ${course.title}`,
    idempotencyKey,
    text,
    attachments: [{ filename: "checkin-tkxhi.png", content: qr }],
    html: layout(
      "Matrícula confirmada",
      paragraphs([
        `Olá, ${escape(enrollment.buyer_name)}! Sua vaga no curso <strong>${escape(course.title)}</strong> está garantida.`,
        `<strong>Quando:</strong> ${escape(when)}<br><strong>Onde:</strong> ${escape(where)}`,
        "No dia, apresente este QR code na entrada. Ele registra sua presença e é pessoal — não compartilhe.",
      ]) +
        `<p style="margin:20px 0;text-align:center"><img src="${escape(qrSrc)}" width="240" height="240" alt="QR code de check-in da sua matrícula"></p>` +
        paragraphs([
          `O mesmo QR code vai em anexo, caso seu leitor de e-mail bloqueie imagens.`,
          `<span style="color:#6b5a7d;font-size:13px">Matrícula ${escape(enrollment.id)} · ${escape(formatBRL(enrollment.amount_cents))}</span>`,
          `Precisa desistir? Peça o reembolso em <a href="${escape(`${appUrl()}/reembolso`)}" style="color:#822ca3">${escape(`${appUrl()}/reembolso`)}</a>.`,
        ]),
    ),
  });
}

export async function sendRefundLinks(
  email: string,
  items: { enrollment: Enrollment; course: Course | undefined }[],
): Promise<boolean> {
  const lines = items.map(({ enrollment, course }) => ({
    label: `${course?.title ?? enrollment.course_id} — matrícula de ${formatDateTime(enrollment.created_at)}`,
    href: refundLinkFor(enrollment.id),
  }));

  return trySend({
    to: email,
    subject: "Seu link para pedir reembolso",
    text: [
      "Recebemos um pedido de reembolso para este e-mail. Use o link da matrícula correspondente (válido por 72 horas):",
      ...lines.map((line) => `${line.label}\n${line.href}`),
      "Se não foi você, ignore esta mensagem: nada muda sem que o link seja aberto.",
    ].join("\n\n"),
    html: layout(
      "Pedido de reembolso",
      paragraphs([
        "Recebemos um pedido de reembolso para este e-mail. Abra o link da matrícula correspondente — ele vale por 72 horas.",
      ]) +
        lines
          .map(
            (line) =>
              `<p style="margin:0 0 4px;font-size:14px;color:#6b5a7d">${escape(line.label)}</p>${button(line.href, "Ver matrícula e pedir reembolso")}`,
          )
          .join("") +
        paragraphs([
          '<span style="font-size:13px;color:#6b5a7d">Se não foi você, ignore esta mensagem: nada muda sem que o link seja aberto.</span>',
        ]),
    ),
  });
}

export type RefundOutcome =
  | { kind: "refunded"; amountCents: number }
  | { kind: "review" }
  | { kind: "denied"; note: string };

export async function sendRefundOutcome(
  enrollment: Enrollment,
  course: Course | undefined,
  outcome: RefundOutcome,
): Promise<boolean> {
  const title = course?.title ?? enrollment.course_id;
  const content =
    outcome.kind === "refunded"
      ? {
          subject: `Reembolso processado — ${title}`,
          heading: "Reembolso processado",
          lines: [
            `Processamos o reembolso de ${formatBRL(outcome.amountCents)} da sua matrícula no curso ${title}.`,
            "O prazo para o valor aparecer depende do meio de pagamento: no Pix costuma ser imediato; no cartão, pode levar até duas faturas.",
          ],
        }
      : outcome.kind === "review"
        ? {
            subject: `Pedido de reembolso recebido — ${title}`,
            heading: "Pedido em análise",
            lines: [
              `Recebemos seu pedido de reembolso da matrícula no curso ${title}.`,
              "Pelas condições da matrícula, este caso é analisado individualmente. Respondemos por e-mail em até 5 dias úteis.",
            ],
          }
        : {
            subject: `Resposta ao pedido de reembolso — ${title}`,
            heading: "Resposta ao pedido de reembolso",
            lines: [
              `Analisamos seu pedido de reembolso da matrícula no curso ${title} e não foi possível aprová-lo.`,
              outcome.note,
              "Se quiser conversar sobre isso, é só responder este e-mail.",
            ],
          };

  return trySend({
    to: enrollment.buyer_email,
    subject: content.subject,
    text: [`Olá, ${enrollment.buyer_name}!`, ...content.lines].join("\n\n"),
    html: layout(
      content.heading,
      paragraphs([
        `Olá, ${escape(enrollment.buyer_name)}!`,
        ...content.lines.map(escape),
      ]),
    ),
  });
}

/**
 * Histórico completo de uma matrícula em texto corrido: consentimento,
 * pagamento, presença e cada evento da auditoria. É o que vai para quem decide
 * um reembolso e o que se anexa numa contestação.
 */
export function evidenceDossier(
  enrollment: Enrollment,
  course: Course | undefined,
  trail: AuditEntry[],
  /** E-mail não é canal seguro: por padrão o CPF sai mascarado. Completo só no painel. */
  { fullCpf = false }: { fullCpf?: boolean } = {},
): string {
  const cpf = formatCpf(buyerCpf(enrollment));
  const lines = [
    `Curso: ${course?.title ?? enrollment.course_id}`,
    `Matrícula: ${enrollment.id}`,
    `Aluno: ${enrollment.buyer_name} <${enrollment.buyer_email}> · CPF ${fullCpf ? cpf : `***.${cpf.slice(4, 11)}-**`}`,
    `Valor: ${formatBRL(enrollment.amount_cents)} · pagamento MP ${enrollment.mp_payment_id ?? "—"} · status ${enrollment.payment_status}`,
    `Pago em: ${enrollment.paid_at ? formatDateTime(enrollment.paid_at) : "—"}`,
    "",
    `CIÊNCIA (versão ${enrollment.consent_version})`,
    `Aceita em ${formatDateTime(enrollment.consent_timestamp)} · IP ${enrollment.consent_ip}`,
    `Navegador: ${enrollment.consent_user_agent ?? "—"}`,
    enrollment.consent_text,
    "",
    "PRESENÇA",
    enrollment.attendance_confirmed && enrollment.attendance_timestamp
      ? `Check-in em ${formatDateTime(enrollment.attendance_timestamp)} por ${enrollment.attendance_by ?? "—"}`
      : "Sem check-in registrado",
    "",
    "REEMBOLSO",
    `Pedido em: ${enrollment.refund_requested_at ? formatDateTime(enrollment.refund_requested_at) : "—"} · status ${enrollment.refund_status}`,
    "",
    "AUDITORIA",
    ...trail.map(
      (entry) =>
        `${formatDateTime(entry.created_at)} · ${entry.actor} · ${entry.action}${entry.ip ? ` · IP ${entry.ip}` : ""}${Object.keys(entry.details).length ? ` · ${JSON.stringify(entry.details)}` : ""}`,
    ),
  ];
  return lines.join("\n");
}

export async function sendAdminAlert(input: {
  subject: string;
  intro: string;
  enrollment: Enrollment;
  course: Course | undefined;
  trail: AuditEntry[];
}): Promise<boolean> {
  const dossier = evidenceDossier(input.enrollment, input.course, input.trail);
  const panel = `${appUrl()}/admin/reembolsos`;
  return trySend({
    to: env.adminNotifyEmails(),
    subject: input.subject,
    text: `${input.intro}\n\nDecida no painel: ${panel}\n\n${dossier}`,
    html: layout(
      input.subject,
      paragraphs([escape(input.intro)]) +
        button(panel, "Abrir o painel") +
        `<pre style="white-space:pre-wrap;font-family:Consolas,monospace;font-size:12px;line-height:1.5;background:#f4eff8;padding:16px;margin:0">${escape(dossier)}</pre>`,
    ),
  });
}

export async function sendCertificate(
  enrollment: Enrollment,
  course: Course,
): Promise<boolean> {
  const href = certificateLinkFor(enrollment);
  return trySend({
    to: enrollment.buyer_email,
    subject: `Seu certificado — ${course.title}`,
    idempotencyKey: `certificate-${enrollment.id}`,
    text: `Olá, ${enrollment.buyer_name}!\n\nObrigado por participar do curso ${course.title}. Seu certificado está disponível em:\n${href}\n\nGuarde este link: ele não expira.`,
    html: layout(
      "Seu certificado está pronto",
      paragraphs([
        `Olá, ${escape(enrollment.buyer_name)}! Obrigado por participar do curso <strong>${escape(course.title)}</strong>.`,
      ]) +
        button(href, "Baixar certificado (PDF)") +
        paragraphs([
          '<span style="font-size:13px;color:#6b5a7d">Guarde este e-mail: o link não expira.</span>',
        ]),
    ),
  });
}
