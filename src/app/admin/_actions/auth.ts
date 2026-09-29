"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, completeSetup, findAdmin } from "@/lib/server/admins";
import { audit } from "@/lib/server/audit";
import { clientIp, userAgent } from "@/lib/server/request";
import {
  createSession,
  currentPrincipal,
  destroySession,
  requireSetup,
} from "@/lib/server/session";

/** Só aceita voltar para dentro do painel — nada de redirecionamento aberto. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_-]*)?$/.test(next) &&
    !next.startsWith("/admin/login")
    ? next
    : "/admin/checkin";
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").slice(0, 64);
  const password = String(formData.get("password") ?? "").slice(0, 256);
  const code = String(formData.get("code") ?? "").slice(0, 12);
  const next = safeNext(formData.get("next"));
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const result = await authenticate({ username, password, code, ip });

  if (!result.ok) {
    await audit({
      actor: "sistema",
      action:
        result.reason === "locked"
          ? "admin_login_locked"
          : "admin_login_failed",
      ip,
      details: { username: username.trim().toLowerCase().slice(0, 40) },
    });
    redirect(
      `/admin/login?erro=${result.reason === "locked" ? "bloqueado" : "credenciais"}&next=${encodeURIComponent(next)}`,
    );
  }

  if (result.kind === "master") {
    await createSession({
      masterUser: result.username,
      stage: "full",
      ip,
      userAgent: userAgent(requestHeaders),
    });
    await audit({
      actor: `master:${result.username}`,
      action: "admin_login",
      ip,
    });
    redirect(next);
  }

  await createSession({
    adminId: result.admin.id,
    stage: result.stage,
    ip,
    userAgent: userAgent(requestHeaders),
  });
  await audit({
    actor: `admin:${result.admin.username}`,
    action: "admin_login",
    ip,
    details: { stage: result.stage },
  });
  redirect(result.stage === "setup" ? "/admin/configurar" : next);
}

export async function logout() {
  const principal = await currentPrincipal();
  await destroySession();
  if (principal) {
    await audit({
      actor: principal.actor,
      action: "admin_logout",
      ip: clientIp(await headers()),
    });
  }
  redirect("/admin/login");
}

export type SetupState = { error: string | null };

/** Primeiro acesso: senha nova + confirmação do 2FA. */
export async function finishSetup(
  _state: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const principal = await requireSetup();
  const admin = principal.adminId ? await findAdmin(principal.adminId) : null;
  if (!admin) redirect("/admin/login");

  const result = await completeSetup({
    admin,
    password: String(formData.get("password") ?? "").slice(0, 256),
    confirm: String(formData.get("confirm") ?? "").slice(0, 256),
    code: String(formData.get("code") ?? "").slice(0, 12),
  });
  if (!result.ok) return { error: result.error };

  // As sessões antigas caíram; abre uma nova, já completa.
  const requestHeaders = await headers();
  await destroySession();
  await createSession({
    adminId: admin.id,
    stage: "full",
    ip: clientIp(requestHeaders),
    userAgent: userAgent(requestHeaders),
  });
  redirect("/admin/checkin");
}
