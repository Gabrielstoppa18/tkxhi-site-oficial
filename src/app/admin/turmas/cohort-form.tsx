"use client";

import { useActionState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCohort, type CohortFormState } from "../_actions/cohorts";

export type CohortFormValues = {
  id?: string;
  courseId: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  price: string;
  capacity: string;
  lateRefundPercent: string;
  lateRefundDaysBefore: string;
  status: string;
};

const initial: CohortFormState = { error: null };

const STATUS = [
  { value: "draft", label: "Rascunho — não aparece no site" },
  { value: "open", label: "Aberta — vendendo" },
  { value: "closed", label: "Fechada — sem novas vendas" },
  { value: "cancelled", label: "Cancelada" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = children.props.id;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Formulário de turma. Toda validação de verdade está no servidor
 * (parseCohortForm); os atributos aqui só adiantam o erro para quem digita.
 */
export function CohortForm({
  values,
  courses,
  lockedCourse,
}: {
  values: CohortFormValues;
  courses: { slug: string; title: string }[];
  /** Turma com matrículas não troca de curso. */
  lockedCourse: boolean;
}) {
  const [state, action, pending] = useActionState(saveCohort, initial);
  const selectClass =
    "h-11 w-full rounded-lg border border-input bg-background px-2.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60";

  return (
    <form action={action} className="grid gap-6 md:grid-cols-2">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Curso">
        <select
          id="courseId"
          name="courseId"
          defaultValue={values.courseId}
          className={selectClass}
          disabled={lockedCourse}
        >
          {courses.map((course) => (
            <option key={course.slug} value={course.slug}>
              {course.title}
            </option>
          ))}
        </select>
      </Field>
      {lockedCourse ? (
        <input type="hidden" name="courseId" value={values.courseId} />
      ) : null}

      <Field
        label="Nome da turma (opcional)"
        hint="Ex.: Turma de novembro. Aparece para o aluno."
      >
        <Input
          id="label"
          name="label"
          defaultValue={values.label}
          maxLength={80}
          className="h-11"
        />
      </Field>

      <Field label="Data">
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={values.date}
          className="h-11"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Início" hint="Horário de Brasília.">
          <Input
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue={values.startTime}
            className="h-11"
          />
        </Field>
        <Field label="Término">
          <Input
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue={values.endTime}
            className="h-11"
          />
        </Field>
      </div>

      <Field label="Local">
        <Input
          id="venue"
          name="venue"
          required
          maxLength={120}
          defaultValue={values.venue}
          className="h-11"
        />
      </Field>

      <Field
        label="Endereço completo"
        hint="Vai no e-mail de confirmação e no texto de ciência."
      >
        <Input
          id="address"
          name="address"
          required
          maxLength={240}
          defaultValue={values.address}
          className="h-11"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Preço (R$)" hint="Vale para as próximas vendas.">
          <Input
            id="price"
            name="price"
            required
            inputMode="decimal"
            defaultValue={values.price}
            className="h-11 font-mono"
          />
        </Field>
        <Field label="Vagas">
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={500}
            required
            defaultValue={values.capacity}
            className="h-11 font-mono"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Reembolso após 7 dias (%)"
          hint="0 = sempre análise manual."
        >
          <Input
            id="lateRefundPercent"
            name="lateRefundPercent"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={values.lateRefundPercent}
            className="h-11 font-mono"
          />
        </Field>
        <Field label="Até quantos dias antes">
          <Input
            id="lateRefundDaysBefore"
            name="lateRefundDaysBefore"
            type="number"
            min={0}
            max={90}
            required
            defaultValue={values.lateRefundDaysBefore}
            className="h-11 font-mono"
          />
        </Field>
      </div>

      <Field label="Situação">
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          className={selectClass}
        >
          {STATUS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="md:col-span-2">
        {state.error ? (
          <p
            role="alert"
            className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
          >
            {state.error}
          </p>
        ) : null}
        <p className="mb-4 text-sm text-muted-foreground">
          Quem já comprou mantém o preço e a política de reembolso da compra.
          Mudança de data ou local não avisa os alunos sozinha: comunique por
          e-mail.
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 px-5"
        >
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
          Salvar turma
        </Button>
      </div>
    </form>
  );
}
