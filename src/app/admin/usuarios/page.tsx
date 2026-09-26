import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { listAdmins } from "@/lib/server/admins";
import { requireMaster } from "@/lib/server/session";
import { toggleAdminAction } from "../_actions/users";
import { CreateAdminForm, ResetAdminForm } from "./user-forms";

/**
 * Admins do painel — só o master (definido no .env) entra aqui. O master não
 * aparece na lista: as credenciais dele não estão no banco.
 */
export default async function UsersPage() {
  const master = await requireMaster();
  const admins = await listAdmins();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Usuários do painel
      </h1>
      <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
        Você entrou como master ({master.username}). Admins criados aqui podem
        gerenciar turmas, check-in e reembolsos, mas não outros admins. Todos
        usam verificação em duas etapas.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Novo admin
        </h2>
        <div className="mt-4">
          <CreateAdminForm />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase">
          Admins
        </h2>
        {admins.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            Nenhum admin criado ainda.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex flex-wrap items-start gap-x-6 gap-y-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {admin.display_name}{" "}
                    <span className="font-mono text-sm text-muted-foreground">
                      @{admin.username}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {!admin.active
                      ? "Desativado"
                      : admin.totp_enabled
                        ? `2FA ativo · último acesso ${admin.last_login_at ? formatDateTime(admin.last_login_at) : "—"}`
                        : "Aguardando primeiro acesso"}
                    {" · criado por "}
                    {admin.created_by}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {admin.active ? (
                    <ResetAdminForm
                      adminId={admin.id}
                      username={admin.username}
                    />
                  ) : null}
                  <form action={toggleAdminAction}>
                    <input type="hidden" name="adminId" value={admin.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={admin.active ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      variant={admin.active ? "destructive" : "outline"}
                      className="h-11"
                    >
                      {admin.active ? (
                        <ShieldOff aria-hidden />
                      ) : (
                        <ShieldCheck aria-hidden />
                      )}
                      {admin.active ? "Desativar" : "Reativar"}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
