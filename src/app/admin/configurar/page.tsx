import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { findAdmin, pendingTotpSecret } from "@/lib/server/admins";
import { requireSetup } from "@/lib/server/session";
import { otpauthUri } from "@/lib/server/totp";
import { SetupForm } from "./setup-form";

/**
 * Primeiro acesso de um admin criado pelo master: troca a senha temporária e
 * ativa o 2FA. Sem concluir isto, nenhuma outra página do painel abre.
 */
export default async function SetupPage() {
  const principal = await requireSetup();
  const admin = principal.adminId ? await findAdmin(principal.adminId) : null;
  const secret = admin ? pendingTotpSecret(admin) : null;
  if (!admin || !secret) redirect("/admin/login");

  const uri = otpauthUri(admin.username, secret);
  const qr = await QRCode.toDataURL(uri, { width: 240, margin: 1 });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Primeiro acesso
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        Olá, {admin.display_name}. Para liberar o painel, ative a verificação em
        duas etapas e troque a senha temporária. Esta tela expira em 15 minutos.
      </p>

      <ol className="mt-8 space-y-8">
        <li>
          <h2 className="font-medium">1. Escaneie com o app autenticador</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Authenticator, Microsoft Authenticator, Authy ou 1Password.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor */}
          <img
            src={qr}
            width={240}
            height={240}
            alt="QR code para cadastrar a TkxHi no app autenticador"
            className="mt-4 bg-white p-2"
          />
          <details className="mt-3 text-sm">
            <summary className="inline-flex h-11 cursor-pointer items-center underline underline-offset-4">
              Não consigo escanear
            </summary>
            <p className="mt-1 text-muted-foreground">
              Digite esta chave no app, como “chave de configuração”:
            </p>
            <code className="mt-2 block font-mono text-sm break-all select-all">
              {secret.replace(/(.{4})/g, "$1 ").trim()}
            </code>
          </details>
        </li>
        <li>
          <h2 className="font-medium">
            2. Defina sua senha e confirme o código
          </h2>
          <SetupForm username={admin.username} />
        </li>
      </ol>
    </div>
  );
}
