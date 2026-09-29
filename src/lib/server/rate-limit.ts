import "server-only";
import { db } from "@/lib/server/db";

/**
 * Limite por janela fixa, guardado no próprio Postgres — funciona entre
 * instâncias serverless sem Redis. Chaves no formato "<uso>:<tipo>:<valor>".
 */
export const LIMITS = {
  /** Tentativas de login por IP. */
  loginIp: { limit: 30, windowSeconds: 15 * 60 },
  /** Falhas de login por usuário — depois disso a conta fica travada pela janela. */
  loginUser: { limit: 5, windowSeconds: 15 * 60 },
  /** Matrículas iniciadas por IP. */
  checkoutIp: { limit: 10, windowSeconds: 10 * 60 },
  /** Pedidos de link de reembolso por IP. */
  refundLinkIp: { limit: 5, windowSeconds: 15 * 60 },
} as const;

type Limit = { limit: number; windowSeconds: number };

/** Conta uma ocorrência e diz se ainda está dentro do limite. */
export async function consume(key: string, { limit, windowSeconds }: Limit) {
  const [row] = await db()<{ count: number }[]>`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `;
  // Faxina ocasional das janelas antigas, sem job agendado.
  if (Math.random() < 0.02) {
    await db()`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`;
  }
  return row.count <= limit;
}

/** Já estourou o limite nesta janela? Não conta a consulta. */
export async function isLimited(key: string, { limit, windowSeconds }: Limit) {
  const [row] = await db()<{ count: number }[]>`
    SELECT count FROM rate_limits
    WHERE key = ${key}
      AND window_start >= now() - make_interval(secs => ${windowSeconds})
  `;
  return (row?.count ?? 0) >= limit;
}

export async function resetLimit(key: string) {
  await db()`DELETE FROM rate_limits WHERE key = ${key}`;
}
