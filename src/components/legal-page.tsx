import type { ReactNode } from "react";

/**
 * Moldura das páginas legais (termos de uso, política de privacidade): mesmo
 * cabeçalho, mesma largura de leitura, mesmas seções.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <article className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[1] font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <div className="mt-6 text-lg text-pretty">{intro}</div>
        <div className="mt-12 space-y-10">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border/70 pt-8">
      <h2 className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-pretty text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
