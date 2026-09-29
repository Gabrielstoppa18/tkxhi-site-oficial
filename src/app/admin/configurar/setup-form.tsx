"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { finishSetup, type SetupState } from "../_actions/auth";

const initial: SetupState = { error: null };

export function SetupForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(finishSetup, initial);

  return (
    <form action={action} className="mt-4 space-y-5">
      {/* Ajuda o gerenciador de senhas a salvar no usuário certo. */}
      <input
        type="text"
        name="username"
        value={username}
        autoComplete="username"
        readOnly
        hidden
      />
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          className="h-11"
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Pelo menos 12 caracteres. Uma frase longa é mais forte que uma senha
          curta cheia de símbolos.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Repita a nova senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Código de 6 dígitos do app</Label>
        <Input
          id="code"
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          className="h-11 font-mono tracking-[0.3em]"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full"
      >
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Ativar e entrar
      </Button>
    </form>
  );
}
