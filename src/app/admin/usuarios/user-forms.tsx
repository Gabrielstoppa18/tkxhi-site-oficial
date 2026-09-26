"use client";

import { useActionState } from "react";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAdminAction,
  resetAdminAction,
  type UserActionState,
} from "../_actions/users";

const idle: UserActionState = { status: "idle" };

/** A senha aparece uma vez, aqui. Recarregar a página apaga — não fica guardada em lugar nenhum. */
function TemporaryPassword({
  state,
}: {
  state: Extract<UserActionState, { status: "created" }>;
}) {
  return (
    <div role="status" className="mt-4 border border-primary p-4">
      <p className="text-sm">
        Senha temporária de <strong>{state.username}</strong>. Passe para a
        pessoa por um canal seguro (pessoalmente ou mensagem que se apaga). Ela
        troca a senha e ativa o 2FA no primeiro acesso.
      </p>
      <code className="mt-3 block font-mono text-lg break-all select-all">
        {state.password}
      </code>
      <p className="mt-2 text-xs text-muted-foreground">
        Esta senha não será mostrada de novo.
      </p>
    </div>
  );
}

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminAction, idle);

  return (
    <div>
      <form
        action={action}
        className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="new-username">Usuário</Label>
          <Input
            id="new-username"
            name="username"
            required
            pattern="[a-z0-9][a-z0-9._\-]{2,31}"
            maxLength={32}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ex.: marcos"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-name">Nome da pessoa</Label>
          <Input
            id="new-name"
            name="displayName"
            required
            maxLength={80}
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-11 px-4">
          {pending ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <UserPlus aria-hidden />
          )}
          Criar admin
        </Button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.status === "created" ? <TemporaryPassword state={state} /> : null}
    </div>
  );
}

export function ResetAdminForm({
  adminId,
  username,
}: {
  adminId: string;
  username: string;
}) {
  const [state, action, pending] = useActionState(resetAdminAction, idle);

  return (
    <div>
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Gerar nova senha para ${username}? O 2FA dele será zerado e as sessões abertas caem.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="adminId" value={adminId} />
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="h-11"
        >
          <KeyRound aria-hidden />
          Nova senha
        </Button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.status === "created" ? <TemporaryPassword state={state} /> : null}
    </div>
  );
}
