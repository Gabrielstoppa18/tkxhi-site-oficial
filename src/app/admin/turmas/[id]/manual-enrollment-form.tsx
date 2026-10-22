"use client";

import { useActionState, useId } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskPhone } from "@/lib/phone";
import {
  createManualEnrollmentAction,
  type ManualEnrollmentState,
} from "../../_actions/enrollments";

const idle: ManualEnrollmentState = { status: "idle" };

/**
 * Matrícula feita pela equipe, para parcerias e cortesias. Entra já paga,
 * sem Mercado Pago. Validação de verdade no servidor (manual-enrollment.ts).
 */
export function ManualEnrollmentForm({
  cohortId,
  defaultAmount,
}: {
  cohortId: string;
  /** Preço da turma, como sugestão para o valor pago. */
  defaultAmount: string;
}) {
  const [state, action, pending] = useActionState(
    createManualEnrollmentAction,
    idle,
  );
  const id = useId();
  // React limpa o formulário depois da ação; no erro, os campos voltam
  // preenchidos com o que foi enviado.
  const values = state.status === "error" ? state.values : {};

  return (
    <div>
      <form action={action} className="grid gap-5 md:grid-cols-2">
        <input type="hidden" name="cohortId" value={cohortId} />

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${id}-partner`}>Parceria ou motivo</Label>
          <Input
            id={`${id}-partner`}
            name="partner"
            defaultValue={values.partner}
            required
            minLength={2}
            maxLength={120}
            placeholder="ex.: Parceria Escola Estadual X"
            className="h-11"
            aria-describedby={`${id}-partner-hint`}
          />
          <p
            id={`${id}-partner-hint`}
            className="text-xs text-muted-foreground"
          >
            Fica no registro da matrícula e aparece na lista de check-in.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>Nome completo do aluno</Label>
          <Input
            id={`${id}-name`}
            name="name"
            defaultValue={values.name}
            required
            minLength={3}
            maxLength={120}
            autoComplete="off"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-email`}>E-mail</Label>
          <Input
            id={`${id}-email`}
            name="email"
            defaultValue={values.email}
            type="email"
            required
            autoComplete="off"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-phone`}>Telefone (opcional)</Label>
          <Input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(64) 99999-9999"
            defaultValue={values.phone}
            onChange={(event) => {
              event.currentTarget.value = maskPhone(event.currentTarget.value);
            }}
            className="h-11 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-cpf`}>CPF (opcional)</Label>
          <Input
            id={`${id}-cpf`}
            name="cpf"
            defaultValue={values.cpf}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            className="h-11 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-amount`}>Valor pago (R$)</Label>
          <Input
            id={`${id}-amount`}
            name="amount"
            inputMode="decimal"
            defaultValue={values.amount ?? defaultAmount}
            className="h-11 font-mono"
            aria-describedby={`${id}-amount-hint`}
          />
          <p id={`${id}-amount-hint`} className="text-xs text-muted-foreground">
            0 para cortesia. Só registro: nada é cobrado.
          </p>
        </div>
        <div className="flex items-start gap-3 self-center">
          <input
            id={`${id}-send`}
            name="sendEmail"
            type="checkbox"
            defaultChecked
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <label htmlFor={`${id}-send`} className="text-sm leading-snug">
            Enviar ao aluno o e-mail de confirmação com o QR code
          </label>
        </div>

        <div className="md:col-span-2">
          {state.status === "error" ? (
            <p
              role="alert"
              className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}
          {state.status === "created" ? (
            <p
              role="status"
              className="mb-4 border-l-2 border-primary pl-3 text-sm"
            >
              {state.name} matriculado.
              {state.askedEmail
                ? state.emailSent
                  ? " E-mail com o QR code enviado."
                  : " O e-mail não saiu — reenvie pela lista de check-in."
                : " Sem e-mail: envie pela lista de check-in quando quiser."}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="h-11 px-4">
            {pending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <UserPlus aria-hidden />
            )}
            Matricular
          </Button>
        </div>
      </form>
    </div>
  );
}
