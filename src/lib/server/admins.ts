import "server-only";
import { audit } from "@/lib/server/audit";
import { decrypt, encrypt } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import {
  hashPassword,
  passwordProblem,
  temporaryPassword,
  verifyPassword,
} from "@/lib/server/password";
import {
  consume,
  isLimited,
  LIMITS,
  resetLimit,
} from "@/lib/server/rate-limit";
import { revokeAdminSessions } from "@/lib/server/session";
import { consumeTotp, generateTotpSecret } from "@/lib/server/totp";

export type Admin = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  must_change_password: boolean;
  totp_secret_enc: string | null;
  totp_pending_enc: string | null;
  totp_enabled: boolean;
  active: boolean;
  created_by: string;
  created_at: Date;
  password_changed_at: Date;
  last_login_at: Date | null;
};

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export type LoginResult =
  | { ok: true; kind: "master"; username: string }
  | { ok: true; kind: "admin"; admin: Admin; stage: "setup" | "full" }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * Login com senha e 2FA. A resposta de erro é sempre a mesma ("usuário, senha
 * ou código incorretos"), e usuário inexistente custa o mesmo tempo que um
 * existente — não dá para descobrir quais nomes existem.
 */
export async function authenticate(input: {
  username: string;
  password: string;
  code: string;
  ip: string;
}): Promise<LoginResult> {
  const username = input.username.trim().toLowerCase().slice(0, 64);
  const userKey = `login:user:${username}`;

  if (!(await consume(`login:ip:${input.ip}`, LIMITS.loginIp))) {
    return { ok: false, reason: "locked" };
  }
  if (await isLimited(userKey, LIMITS.loginUser)) {
    return { ok: false, reason: "locked" };
  }

  const fail = async (): Promise<LoginResult> => {
    await consume(userKey, LIMITS.loginUser);
    return { ok: false, reason: "invalid" };
  };

  const master = env.master();
  if (master && username === master.username) {
    const passwordOk = await verifyPassword(
      input.password,
      master.passwordHash,
    );
    // O código só é conferido (e consumido) depois da senha certa.
    if (
      !passwordOk ||
      !(await consumeTotp("master", master.totpSecret, input.code))
    ) {
      return fail();
    }
    await resetLimit(userKey);
    return { ok: true, kind: "master", username };
  }

  const [admin] = await db()<Admin[]>`
    SELECT * FROM admins WHERE username = ${username} AND active = true
  `;
  const passwordOk = await verifyPassword(input.password, admin?.password_hash);
  if (!admin || !passwordOk) return fail();

  if (admin.totp_enabled && admin.totp_secret_enc) {
    const secret = decrypt(admin.totp_secret_enc, "totp");
    if (!(await consumeTotp(`admin:${admin.id}`, secret, input.code)))
      return fail();
  }

  await resetLimit(userKey);
  const stage =
    admin.must_change_password || !admin.totp_enabled ? "setup" : "full";

  // Primeiro acesso: gera um segredo 2FA novo a cada login, até ser confirmado.
  if (stage === "setup") {
    await db()`
      UPDATE admins SET totp_pending_enc = ${encrypt(generateTotpSecret(), "totp")}
      WHERE id = ${admin.id}
    `;
  } else {
    await db()`UPDATE admins SET last_login_at = now() WHERE id = ${admin.id}`;
  }
  return { ok: true, kind: "admin", admin, stage };
}

export async function findAdmin(id: string): Promise<Admin | null> {
  const [row] = await db()<Admin[]>`SELECT * FROM admins WHERE id = ${id}`;
  return row ?? null;
}

export async function listAdmins(): Promise<Admin[]> {
  return db()<Admin[]>`SELECT * FROM admins ORDER BY active DESC, username`;
}

export function pendingTotpSecret(admin: Admin): string | null {
  return admin.totp_pending_enc
    ? decrypt(admin.totp_pending_enc, "totp")
    : null;
}

/** Cria um admin com senha temporária, devolvida uma única vez para o master repassar. */
export async function createAdmin(input: {
  username: string;
  displayName: string;
  actor: string;
}): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim().slice(0, 80);
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error:
        "Usuário: 3 a 32 caracteres, letras minúsculas, números, ponto, hífen ou sublinhado.",
    };
  }
  if (username === env.master()?.username) {
    return { ok: false, error: "Esse nome é reservado." };
  }
  if (displayName.length < 2)
    return { ok: false, error: "Informe o nome da pessoa." };

  const password = temporaryPassword();
  const [row] = await db()<{ id: string }[]>`
    INSERT INTO admins (username, display_name, password_hash, created_by)
    VALUES (${username}, ${displayName}, ${await hashPassword(password)}, ${input.actor})
    ON CONFLICT (username) DO NOTHING
    RETURNING id
  `;
  if (!row) return { ok: false, error: "Já existe um admin com esse usuário." };

  await audit({
    actor: input.actor,
    action: "admin_created",
    details: { adminId: row.id, username },
  });
  return { ok: true, password };
}

/** Nova senha temporária e 2FA zerado: a pessoa refaz o primeiro acesso. */
export async function resetAdmin(
  id: string,
  actor: string,
): Promise<
  | { ok: true; password: string; username: string }
  | { ok: false; error: string }
> {
  const password = temporaryPassword();
  const [row] = await db()<{ username: string }[]>`
    UPDATE admins SET
      password_hash = ${await hashPassword(password)},
      must_change_password = true,
      totp_secret_enc = NULL,
      totp_pending_enc = NULL,
      totp_enabled = false,
      password_changed_at = now()
    WHERE id = ${id}
    RETURNING username
  `;
  if (!row) return { ok: false, error: "Admin não encontrado." };
  await revokeAdminSessions(id);
  await db()`DELETE FROM totp_replay WHERE principal = ${`admin:${id}`}`;
  await audit({
    actor,
    action: "admin_reset",
    details: { adminId: id, username: row.username },
  });
  return { ok: true, password, username: row.username };
}

export async function setAdminActive(
  id: string,
  active: boolean,
  actor: string,
): Promise<void> {
  const [row] = await db()<{ username: string }[]>`
    UPDATE admins SET active = ${active} WHERE id = ${id} RETURNING username
  `;
  if (!row) return;
  if (!active) await revokeAdminSessions(id);
  await audit({
    actor,
    action: active ? "admin_enabled" : "admin_disabled",
    details: { adminId: id, username: row.username },
  });
}

/**
 * Conclui o primeiro acesso: senha nova definida pela pessoa e 2FA
 * confirmado com um código do app. Derruba todas as sessões anteriores.
 */
export async function completeSetup(input: {
  admin: Admin;
  password: string;
  confirm: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { admin } = input;
  if (input.password !== input.confirm) {
    return { ok: false, error: "As duas senhas não são iguais." };
  }
  const problem = passwordProblem(input.password, admin.username);
  if (problem) return { ok: false, error: problem };
  if (await verifyPassword(input.password, admin.password_hash)) {
    return { ok: false, error: "Escolha uma senha diferente da temporária." };
  }

  const secret = pendingTotpSecret(admin);
  if (
    !secret ||
    !(await consumeTotp(`admin:${admin.id}`, secret, input.code))
  ) {
    return {
      ok: false,
      error:
        "Código do app autenticador incorreto. Confira o horário do celular e tente o próximo código.",
    };
  }

  await db()`
    UPDATE admins SET
      password_hash = ${await hashPassword(input.password)},
      must_change_password = false,
      totp_secret_enc = ${encrypt(secret, "totp")},
      totp_pending_enc = NULL,
      totp_enabled = true,
      password_changed_at = now(),
      last_login_at = now()
    WHERE id = ${admin.id}
  `;
  await revokeAdminSessions(admin.id);
  await audit({
    actor: `admin:${admin.username}`,
    action: "admin_setup_completed",
    details: { adminId: admin.id },
  });
  return { ok: true };
}
