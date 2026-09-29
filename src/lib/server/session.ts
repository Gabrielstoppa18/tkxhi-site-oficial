import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { env, isProduction } from "@/lib/server/env";
import { randomToken, sha256 } from "@/lib/server/crypto";

/**
 * Sessões do painel guardadas no banco, não em cookie assinado: dá para
 * derrubar uma sessão (logout, admin desativado, senha trocada) na hora.
 *
 * - O cookie leva 32 bytes aleatórios; o banco guarda só o SHA-256.
 * - Em produção o cookie usa o prefixo `__Host-`: exige HTTPS, caminho "/" e
 *   proíbe domínio — um subdomínio comprometido não consegue sobrescrevê-lo.
 * - Expira por inatividade (2 h) e por idade (12 h), o que vier primeiro.
 * - A sessão de "setup" (primeiro acesso) só abre /admin/configurar e dura 15 min.
 */
const COOKIE = () => (isProduction() ? "__Host-tkxhi_admin" : "tkxhi_admin");
const IDLE_MINUTES = 120;
const ABSOLUTE_HOURS = 12;
const SETUP_MINUTES = 15;

export type AdminPrincipal = {
  kind: "master" | "admin";
  adminId: string | null;
  username: string;
  displayName: string;
  /** Como aparece na auditoria: "master:<usuário>" ou "admin:<usuário>". */
  actor: string;
  stage: "setup" | "full";
  tokenHash: string;
};

/** Impressão das credenciais do master: trocar senha ou 2FA no .env invalida as sessões dele. */
export function masterFingerprint(): string | null {
  const master = env.master();
  return master ? sha256(`${master.passwordHash}|${master.totpSecret}`) : null;
}

export async function createSession(input: {
  adminId?: string;
  masterUser?: string;
  stage: "setup" | "full";
  ip: string;
  userAgent: string | null;
}): Promise<void> {
  const token = randomToken(32);
  const lifetimeMs =
    input.stage === "setup"
      ? SETUP_MINUTES * 60_000
      : ABSOLUTE_HOURS * 3_600_000;
  const expires = new Date(Date.now() + lifetimeMs);

  await db()`
    INSERT INTO admin_sessions (token_hash, admin_id, master_user, master_fp, stage, ip, user_agent, expires_at)
    VALUES (
      ${sha256(token)}, ${input.adminId ?? null}, ${input.masterUser ?? null},
      ${input.masterUser ? masterFingerprint() : null},
      ${input.stage}, ${input.ip}, ${input.userAgent}, ${expires}
    )
  `;
  // Faxina das sessões vencidas a cada login.
  await db()`DELETE FROM admin_sessions WHERE expires_at < now()`;

  (await cookies()).set(COOKIE(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires,
    priority: "high",
  });
}

type SessionRow = {
  token_hash: string;
  admin_id: string | null;
  master_user: string | null;
  master_fp: string | null;
  stage: "setup" | "full";
  created_at: Date;
  last_seen_at: Date;
  username: string | null;
  display_name: string | null;
  active: boolean | null;
  password_changed_at: Date | null;
};

export async function currentPrincipal(): Promise<AdminPrincipal | null> {
  const token = (await cookies()).get(COOKIE())?.value;
  if (!token || token.length > 100) return null;
  const tokenHash = sha256(token);

  const [row] = await db()<SessionRow[]>`
    SELECT s.token_hash, s.admin_id, s.master_user, s.master_fp, s.stage,
           s.created_at, s.last_seen_at,
           a.username, a.display_name, a.active, a.password_changed_at
    FROM admin_sessions s
    LEFT JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > now()
      AND s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})
  `;
  if (!row) return null;

  let principal: AdminPrincipal | null = null;
  if (row.master_user) {
    const master = env.master();
    if (
      master &&
      master.username === row.master_user &&
      row.master_fp === masterFingerprint()
    ) {
      principal = {
        kind: "master",
        adminId: null,
        username: master.username,
        displayName: `${master.username} (master)`,
        actor: `master:${master.username}`,
        stage: "full",
        tokenHash,
      };
    }
  } else if (
    row.admin_id &&
    row.username &&
    row.active &&
    row.password_changed_at &&
    row.password_changed_at <= row.created_at
  ) {
    principal = {
      kind: "admin",
      adminId: row.admin_id,
      username: row.username,
      displayName: row.display_name ?? row.username,
      actor: `admin:${row.username}`,
      stage: row.stage,
      tokenHash,
    };
  }

  if (!principal) {
    await db()`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
    return null;
  }

  // Renova a inatividade sem escrever no banco a cada clique.
  if (Date.now() - row.last_seen_at.getTime() > 5 * 60_000) {
    await db()`UPDATE admin_sessions SET last_seen_at = now() WHERE token_hash = ${tokenHash}`;
  }
  return principal;
}

/**
 * Chame no início de TODA página e server action do painel. O layout não
 * protege nada: server actions podem ser chamadas diretamente.
 */
export async function requireAdmin(
  next = "/admin/checkin",
): Promise<AdminPrincipal> {
  const principal = await currentPrincipal();
  if (!principal) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (principal.stage !== "full") redirect("/admin/configurar");
  return principal;
}

export async function requireMaster(): Promise<AdminPrincipal> {
  const principal = await requireAdmin("/admin/usuarios");
  if (principal.kind !== "master") redirect("/admin/checkin");
  return principal;
}

export async function requireSetup(): Promise<AdminPrincipal> {
  const principal = await currentPrincipal();
  if (!principal) redirect("/admin/login");
  if (principal.stage === "full") redirect("/admin/checkin");
  return principal;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE())?.value;
  if (token) {
    await db()`DELETE FROM admin_sessions WHERE token_hash = ${sha256(token)}`;
  }
  store.delete(COOKIE());
}

export async function revokeAdminSessions(adminId: string): Promise<void> {
  await db()`DELETE FROM admin_sessions WHERE admin_id = ${adminId}`;
}
