/**
 * A regra de reembolso, sem banco nem rede: recebe os fatos e devolve a
 * decisão. O sistema só decide sozinho quando a resposta é "sim" — qualquer
 * caso em que o reembolso possa ser negado vai para pessoas.
 *
 * 1. Até 7 dias do pagamento, sem presença → integral, automático.
 * 2. Até 7 dias, com presença → análise manual (o serviço foi consumido).
 * 3. Depois de 7 dias, sem presença, com a antecedência mínima → parcial,
 *    automático.
 * 4. Qualquer outro caso → análise manual.
 */
export const WITHDRAWAL_DAYS = 7;
const DAY_MS = 86_400_000;

/** Política congelada na matrícula no momento da compra. */
export type RefundPolicy = {
  latePercent: number;
  untilDaysBefore: number;
};

export type RefundDecision =
  | { kind: "auto"; amountCents: number; rule: string }
  | { kind: "manual"; rule: string };

export function decideRefund(input: {
  paidAt: Date;
  now: Date;
  attended: boolean;
  classStartsAt: Date | null;
  amountCents: number;
  policy: RefundPolicy;
}): RefundDecision {
  const withinWithdrawal =
    input.now.getTime() - input.paidAt.getTime() <= WITHDRAWAL_DAYS * DAY_MS;

  if (withinWithdrawal && !input.attended) {
    return {
      kind: "auto",
      amountCents: input.amountCents,
      rule: "dentro de 7 dias, sem presença: reembolso integral",
    };
  }
  if (withinWithdrawal) {
    return {
      kind: "manual",
      rule: "dentro de 7 dias, com presença confirmada: análise manual",
    };
  }
  if (input.attended) {
    return {
      kind: "manual",
      rule: "fora de 7 dias, com presença confirmada: análise manual",
    };
  }

  const deadline = input.classStartsAt
    ? input.classStartsAt.getTime() - input.policy.untilDaysBefore * DAY_MS
    : null;
  if (
    deadline !== null &&
    input.now.getTime() <= deadline &&
    input.policy.latePercent > 0
  ) {
    return {
      kind: "auto",
      amountCents: Math.round(
        (input.amountCents * input.policy.latePercent) / 100,
      ),
      rule: `fora de 7 dias, até ${input.policy.untilDaysBefore} dias antes da turma: reembolso de ${input.policy.latePercent}%`,
    };
  }
  return {
    kind: "manual",
    rule: `fora de 7 dias e a menos de ${input.policy.untilDaysBefore} dias da turma: análise manual`,
  };
}
