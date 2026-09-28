import type { Cohort, Course } from "@/lib/courses";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Texto de ciência exibido ao lado do checkbox da matrícula.
 *
 * O formulário mostra exatamente o que esta função devolve, e o servidor
 * recalcula o texto a partir da turma em vez de aceitar o que o navegador
 * mandar — o que fica gravado é o que estava na tela, sem margem para edição.
 *
 * Mudou a redação? Troque a versão. Matrículas antigas continuam com o texto e
 * a versão que o aluno de fato aceitou.
 *
 * Revise esta redação com um advogado antes de abrir as vendas: o direito de
 * arrependimento (CDC, art. 49) não pode ser renunciado por contrato.
 */
export const CONSENT_VERSION = "2026-09-28";

export function consentItems(course: Course, cohort: Cohort): string[] {
  return [
    `O curso ${course.title} é presencial e acontece em ${formatDate(cohort.startsAt)}, das ${formatTime(cohort.startsAt)} às ${formatTime(cohort.endsAt)}, em ${cohort.venue} (${cohort.address}).`,
    "Minha presença será registrada por check-in com QR code no dia do curso.",
    "Posso desistir em até 7 dias corridos após o pagamento e recebo o valor integral de volta, desde que não tenha participado do curso.",
    "Se eu participar do curso, um pedido de reembolso posterior não é automático: ele será analisado individualmente pela TkxHi, considerando que o serviço foi prestado.",
    cohort.lateRefundPercent > 0
      ? `Depois dos 7 dias, se eu não tiver participado, recebo ${cohort.lateRefundPercent}% do valor pedindo o reembolso até ${cohort.lateRefundDaysBefore} dias antes da turma. Outros casos são analisados individualmente.`
      : "Depois dos 7 dias, pedidos de reembolso são analisados individualmente.",
    "Meus dados (nome, e-mail, CPF e o registro desta ciência) serão tratados conforme a Política de Privacidade da TkxHi, publicada no site.",
  ];
}

export function consentText(course: Course, cohort: Cohort): string {
  const items = consentItems(course, cohort)
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
  return `Declaro que li e estou ciente de que:\n${items}`;
}
