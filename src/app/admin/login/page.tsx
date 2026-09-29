import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentPrincipal } from "@/lib/server/session";
import { login } from "../_actions/auth";

const ERRORS: Record<string, string> = {
  credenciais: "Usuário, senha ou código incorretos.",
  bloqueado:
    "Muitas tentativas seguidas. Por segurança, o acesso ficou travado por 15 minutos.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : "/admin/checkin";
  const principal = await currentPrincipal();
  if (principal) {
    redirect(
      principal.stage === "setup" ? "/admin/configurar" : "/admin/checkin",
    );
  }
  const error = typeof query.erro === "string" ? ERRORS[query.erro] : null;

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Painel TkxHi
      </h1>
      <p className="mt-2 text-muted-foreground">
        Turmas, check-in, reembolsos e auditoria dos cursos.
      </p>

      <form action={login} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            name="username"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={64}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={256}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Código do app autenticador</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            className="h-11 font-mono tracking-[0.3em]"
            aria-describedby="code-hint"
          />
          <p id="code-hint" className="text-xs text-muted-foreground">
            No primeiro acesso, deixe em branco: você vai configurar o app em
            seguida.
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="h-11 w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
