"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Field = "name" | "email" | "cpf" | "consent";

export type CohortOption = {
  id: string;
  title: string;
  detail: string;
  soldOut: boolean;
  consentItems: string[];
};

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/**
 * Formulário de matrícula. O texto de ciência de cada turma chega pronto do
 * servidor — é o mesmo que a rota recalcula e grava. O checkbox começa
 * desmarcado e volta a ficar desmarcado quando a turma muda, porque o texto
 * aceito muda junto.
 */
export function EnrollmentForm({
  cohorts,
  consentVersion,
}: {
  cohorts: CohortOption[];
  consentVersion: string;
}) {
  const id = useId();
  const firstAvailable =
    cohorts.find((cohort) => !cohort.soldOut) ?? cohorts[0];
  const [cohortId, setCohortId] = useState(firstAvailable.id);
  const [accepted, setAccepted] = useState(false);
  const selected =
    cohorts.find((cohort) => cohort.id === cohortId) ?? firstAvailable;
  const consentItems = selected.consentItems;
  const [cpf, setCpf] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; field?: Field } | null>(
    null,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId: selected.id,
          name: form.get("name"),
          email: form.get("email"),
          cpf: form.get("cpf"),
          consent: accepted,
          consentVersion,
        }),
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
        field?: Field;
      };
      if (!response.ok || !data.url) {
        setError({
          message: data.error ?? "Algo deu errado. Tente de novo.",
          field: data.field,
        });
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError({ message: "Sem conexão. Confira a internet e tente de novo." });
      setPending(false);
    }
  }

  const errorId = `${id}-error`;
  const fieldProps = (field: Field) =>
    error?.field === field
      ? { "aria-invalid": true, "aria-describedby": errorId }
      : {};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {cohorts.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Turma</legend>
          {cohorts.map((cohort) => (
            <label
              key={cohort.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 border border-border p-3 has-checked:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-60"
            >
              <input
                type="radio"
                name="cohort"
                value={cohort.id}
                checked={cohort.id === selected.id}
                disabled={cohort.soldOut}
                onChange={() => {
                  setCohortId(cohort.id);
                  setAccepted(false);
                }}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <span className="block font-medium first-letter:uppercase">
                  {cohort.title}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {cohort.soldOut ? "Esgotada" : cohort.detail}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Nome completo</Label>
        <Input
          id={`${id}-name`}
          name="name"
          required
          minLength={3}
          maxLength={120}
          autoComplete="name"
          className="h-11"
          {...fieldProps("name")}
        />
        <p className="text-xs text-muted-foreground">
          É o nome que vai no certificado.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>E-mail</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="h-11"
          {...fieldProps("email")}
        />
        <p className="text-xs text-muted-foreground">
          O QR code de entrada chega por aqui.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-cpf`}>CPF</Label>
        <Input
          id={`${id}-cpf`}
          name="cpf"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          pattern="\d{3}\.?\d{3}\.?\d{3}-?\d{2}"
          value={cpf}
          onChange={(event) => setCpf(maskCpf(event.target.value))}
          className="h-11 font-mono"
          {...fieldProps("cpf")}
        />
      </div>

      <fieldset className="border border-border p-4 sm:p-5">
        <legend className="px-2 font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Condições da matrícula
        </legend>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-pretty text-muted-foreground">
          {consentItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <div className="mt-5 flex items-start gap-3">
          <input
            id={`${id}-consent`}
            name="consent"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            type="checkbox"
            required
            className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            {...fieldProps("consent")}
          />
          <label
            htmlFor={`${id}-consent`}
            className="text-sm leading-snug font-medium"
          >
            Li e estou ciente das condições acima.
          </label>
        </div>
        <p className="mt-3 pl-8 text-xs text-muted-foreground">
          <a
            href="/termos-de-uso"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Termos de Uso
          </a>{" "}
          ·{" "}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Política de Privacidade
          </a>{" "}
          (abrem em outra aba)
        </p>
      </fieldset>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="border-l-2 border-destructive pl-3 text-sm text-destructive"
        >
          {error.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending || selected.soldOut}
        className="h-11 w-full text-base"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            Abrindo o pagamento…
          </>
        ) : (
          <>
            Ir para o pagamento
            <ArrowRight aria-hidden />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Pagamento processado pelo Mercado Pago, por Pix ou cartão.
      </p>
    </form>
  );
}
