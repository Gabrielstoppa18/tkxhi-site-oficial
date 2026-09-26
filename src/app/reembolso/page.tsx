import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/lib/site-config";
import { requestRefundLink } from "./actions";

export const metadata: Metadata = {
  title: "Reembolso de curso",
  description:
    "Peça o reembolso de uma matrícula em curso da TkxHi. Enviamos um link seguro para o e-mail usado na compra.",
  alternates: { canonical: "/reembolso" },
};

export default async function RefundLookupPage({
  searchParams,
}: PageProps<"/reembolso">) {
  const query = await searchParams;

  return (
    <main className="pillar-impressao-3d flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl px-6 py-20 sm:py-24">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
          Cursos
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
          Pedir reembolso
        </h1>

        {query.enviado ? (
          <div role="status" className="mt-8 border-l-2 border-primary pl-5">
            <MailCheck aria-hidden className="size-6 text-primary" />
            <p className="mt-3 text-lg text-pretty">
              Se houver matrícula paga para esse dado, enviamos um link para o
              e-mail usado na compra. Ele vale por 72 horas.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Não chegou em alguns minutos? Olhe o spam ou escreva para{" "}
              {siteConfig.contact.email}.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">
              Informe o e-mail da compra ou o número da matrícula (está no
              e-mail de confirmação). Por segurança, a matrícula não aparece
              aqui: mandamos um link para o e-mail cadastrado.
            </p>
            {query.expirado ? (
              <p
                role="alert"
                className="mt-6 border-l-2 border-destructive pl-3 text-sm text-destructive"
              >
                O link expirou ou é inválido. Peça um novo abaixo.
              </p>
            ) : null}
            <form action={requestRefundLink} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lookup">E-mail ou número da matrícula</Label>
                <Input
                  id="lookup"
                  name="lookup"
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 px-5">
                Enviar link
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
