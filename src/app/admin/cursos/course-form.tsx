"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COURSE_ICONS,
  COURSE_PILLARS,
  type Course,
  type CourseIconKey,
  type CourseModule,
} from "@/lib/courses";
import { photos } from "@/lib/photos";
import { saveCourse, type CourseFormState } from "../_actions/courses";

const initial: CourseFormState = { error: null };
const MAX_MODULES = 12;

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-2.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type ModuleDraft = CourseModule & { key: number };

/**
 * Cadastro e edição de curso. A validação de verdade está no servidor
 * (parseCourseForm); os atributos aqui só adiantam o erro.
 */
export function CourseForm({
  course,
  defaultEdition,
}: {
  course?: Course;
  /** Ano atual, calculado no servidor (o render do cliente precisa ser puro). */
  defaultEdition: string;
}) {
  const [state, action, pending] = useActionState(saveCourse, initial);
  const id = useId();
  const [modules, setModules] = useState<ModuleDraft[]>(() =>
    (course?.modules.length
      ? course.modules
      : [{ title: "", description: "", icon: "lightbulb" as CourseIconKey }]
    ).map((module, index) => ({ ...module, key: index })),
  );
  const [nextKey, setNextKey] = useState(modules.length);

  const update = (key: number, patch: Partial<CourseModule>) =>
    setModules((list) =>
      list.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  const move = (index: number, delta: number) =>
    setModules((list) => {
      const copy = [...list];
      const [item] = copy.splice(index, 1);
      copy.splice(index + delta, 0, item);
      return copy;
    });

  return (
    <form action={action} className="space-y-10">
      {course ? (
        <input type="hidden" name="existingSlug" value={course.slug} />
      ) : null}

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-4 font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Apresentação
        </legend>
        <Field id={`${id}-title`} label="Nome do curso">
          <Input
            id={`${id}-title`}
            name="title"
            required
            minLength={3}
            maxLength={80}
            defaultValue={course?.title}
            className="h-11"
          />
        </Field>
        <Field
          id={`${id}-slug`}
          label="Endereço"
          hint={
            course
              ? "Não muda depois de criado: turmas e certificados apontam para ele."
              : "Vazio = gerado a partir do nome. Só letras, números e hífen."
          }
        >
          <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-2.5 font-mono text-sm text-muted-foreground">
              /cursos/
            </span>
            <input
              id={`${id}-slug`}
              name="slug"
              defaultValue={course?.slug}
              readOnly={Boolean(course)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={60}
              aria-describedby={`${id}-slug-hint`}
              className="h-11 min-w-0 flex-1 bg-transparent px-1 font-mono text-sm outline-none read-only:text-muted-foreground"
            />
          </div>
        </Field>
        <Field
          id={`${id}-pillar`}
          label="Frente"
          hint="Define a cor e a textura da página do curso."
        >
          <select
            id={`${id}-pillar`}
            name="pillar"
            defaultValue={course?.pillar ?? "impressao-3d"}
            className={selectClass}
          >
            {Object.entries(COURSE_PILLARS).map(([value, pillar]) => (
              <option key={value} value={value}>
                {pillar.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id={`${id}-edition`}
          label="Edição"
          hint="Ex.: 2026. Aparece no certificado."
        >
          <Input
            id={`${id}-edition`}
            name="edition"
            required
            maxLength={20}
            defaultValue={course?.edition ?? defaultEdition}
            className="h-11"
          />
        </Field>
        <Field
          id={`${id}-tagline`}
          label="Chamada"
          hint="Uma frase curta, em destaque na cor da frente."
        >
          <Input
            id={`${id}-tagline`}
            name="tagline"
            required
            minLength={3}
            maxLength={120}
            defaultValue={course?.tagline}
            className="h-11"
          />
        </Field>
        <Field
          id={`${id}-authors`}
          label="Instrutores"
          hint="Aparece na página e no certificado."
        >
          <Input
            id={`${id}-authors`}
            name="authors"
            required
            minLength={3}
            maxLength={120}
            defaultValue={course?.authors}
            className="h-11"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            id={`${id}-lead`}
            label="Descrição"
            hint="Duas ou três linhas: o que a pessoa sai sabendo fazer."
          >
            <Textarea
              id={`${id}-lead`}
              name="lead"
              required
              minLength={10}
              maxLength={400}
              rows={3}
              defaultValue={course?.lead}
            />
          </Field>
        </div>
        <Field id={`${id}-photo`} label="Foto de abertura">
          <select
            id={`${id}-photo`}
            name="photo"
            defaultValue={course?.photo ?? "turtleSensor"}
            className={selectClass}
          >
            {Object.entries(photos).map(([key, photo]) => (
              <option key={key} value={key}>
                {photo.alt.length > 70
                  ? `${photo.alt.slice(0, 70)}…`
                  : photo.alt}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Programa · {modules.length}{" "}
          {modules.length === 1 ? "módulo" : "módulos"}
        </legend>
        <ol className="space-y-4">
          {modules.map((module, index) => (
            <li key={module.key} className="border border-border p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
                <Field
                  id={`${id}-m${module.key}-title`}
                  label={`Módulo ${index + 1}`}
                >
                  <Input
                    id={`${id}-m${module.key}-title`}
                    name="moduleTitle"
                    required
                    minLength={2}
                    maxLength={60}
                    value={module.title}
                    onChange={(event) =>
                      update(module.key, { title: event.target.value })
                    }
                    className="h-11"
                  />
                </Field>
                <Field id={`${id}-m${module.key}-icon`} label="Ícone">
                  <select
                    id={`${id}-m${module.key}-icon`}
                    name="moduleIcon"
                    value={module.icon}
                    onChange={(event) =>
                      update(module.key, {
                        icon: event.target.value as CourseIconKey,
                      })
                    }
                    className={selectClass}
                  >
                    {Object.entries(COURSE_ICONS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Label
                    htmlFor={`${id}-m${module.key}-description`}
                    className="sr-only"
                  >
                    Descrição do módulo {index + 1}
                  </Label>
                  <Textarea
                    id={`${id}-m${module.key}-description`}
                    name="moduleDescription"
                    required
                    minLength={5}
                    maxLength={300}
                    rows={2}
                    placeholder="O que se aprende neste módulo"
                    value={module.description}
                    onChange={(event) =>
                      update(module.key, { description: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Subir o módulo ${index + 1}`}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={index === modules.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Descer o módulo ${index + 1}`}
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={modules.length === 1}
                  onClick={() =>
                    setModules((list) =>
                      list.filter((item) => item.key !== module.key),
                    )
                  }
                >
                  <Trash2 aria-hidden />
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 px-4"
          disabled={modules.length >= MAX_MODULES}
          onClick={() => {
            setModules((list) => [
              ...list,
              { key: nextKey, title: "", description: "", icon: "lightbulb" },
            ]);
            setNextKey((value) => value + 1);
          }}
        >
          <Plus aria-hidden />
          Adicionar módulo
        </Button>
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-4 font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Especificações
        </legend>
        <Field
          id={`${id}-materials`}
          label="Materiais abordados"
          hint="Um por linha. Vazio = não aparece."
        >
          <Textarea
            id={`${id}-materials`}
            name="materials"
            rows={4}
            defaultValue={course?.materials.join("\n")}
          />
        </Field>
        <Field
          id={`${id}-software`}
          label="Software"
          hint="Um por linha. Vazio = não aparece."
        >
          <Textarea
            id={`${id}-software`}
            name="software"
            rows={4}
            defaultValue={course?.software.join("\n")}
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            id={`${id}-requirements`}
            label="O que trazer"
            hint="Vazio = não aparece."
          >
            <Input
              id={`${id}-requirements`}
              name="requirements"
              maxLength={200}
              defaultValue={course?.requirements}
              className="h-11"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-4 font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Publicação
        </legend>
        <Field id={`${id}-status`} label="Situação">
          <select
            id={`${id}-status`}
            name="status"
            defaultValue={course?.status ?? "draft"}
            className={selectClass}
          >
            <option value="draft">Rascunho — não aparece no site</option>
            <option value="published">
              Publicado — no catálogo e com página
            </option>
            <option value="archived">
              Arquivado — fora do catálogo, página mantida
            </option>
          </select>
        </Field>
        <Field
          id={`${id}-position`}
          label="Ordem no catálogo"
          hint="Menor aparece primeiro."
        >
          <Input
            id={`${id}-position`}
            name="position"
            type="number"
            min={0}
            max={999}
            defaultValue={course?.position ?? 0}
            className="h-11 font-mono"
          />
        </Field>
      </fieldset>

      <div>
        {state.error ? (
          <p
            role="alert"
            className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
          >
            {state.error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 px-5"
        >
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
          Salvar curso
        </Button>
      </div>
    </form>
  );
}
