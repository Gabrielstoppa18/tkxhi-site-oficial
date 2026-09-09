import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="font-mono text-sm tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
          Página não encontrada
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Voltar para a home</Link>
        </Button>
      </div>
    </main>
  );
}
