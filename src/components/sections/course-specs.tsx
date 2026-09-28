import type { ReactElement } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import type { Course } from "@/lib/courses";

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border border-border px-3 py-1.5 font-mono text-xs tracking-wide"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CourseSpecs({ course }: { course: Course }) {
  // Campos vazios no cadastro do curso simplesmente não aparecem.
  const rows = [
    course.materials.length > 0 && {
      label: "Materiais abordados",
      content: <Chips items={course.materials} />,
    },
    course.software.length > 0 && {
      label: "Software",
      content: <Chips items={course.software} />,
    },
    course.requirements && {
      label: "O que trazer",
      content: <p className="mt-3 text-lg">{course.requirements}</p>,
    },
    {
      label: "Certificado",
      content: (
        <p className="mt-3 text-lg text-pretty">
          Certificado de participação em PDF, enviado por e-mail a quem fez
          check-in no dia.
        </p>
      ),
    },
  ].filter((row): row is { label: string; content: ReactElement } =>
    Boolean(row),
  );

  return (
    <section className="border-t border-border/70">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-12">
        <SectionHeading
          eyebrow="Especificações"
          title="Mão na massa, do primeiro ao último módulo"
          lead="O curso é prático: cada conceito sai da explicação direto para a bancada."
          className="lg:col-span-5"
        />
        <dl className="grid gap-px border-t border-border/70 lg:col-span-7">
          {rows.map((row, index) => (
            <Reveal
              key={row.label}
              delay={index * 0.06}
              className="border-b border-border/70 py-6"
            >
              <dt className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
                {row.label}
              </dt>
              <dd>{row.content}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
