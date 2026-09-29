import "server-only";
import postgres from "postgres";
import { env } from "@/lib/server/env";

/**
 * Cliente Postgres único por processo. `prepare: false` mantém compatibilidade
 * com o pooler em modo transação do Supabase e do Neon, que não suportam
 * prepared statements nomeados. Em desenvolvimento o cliente sobrevive ao
 * hot reload pelo globalThis, senão cada edição abriria uma conexão nova.
 *
 * `connect_timeout` curto: sem ele, uma conexão pendurada com o pooler
 * segura a requisição (ou o build) por muito tempo antes de falhar.
 *
 * Na Vercel, cada instância serverless (e cada processo do build) tem o seu
 * cliente. Com várias delas vivas, 5 conexões por instância esgotam as
 * poucas vagas do pooler do plano grátis do Supabase, e a consulta seguinte
 * fica na fila até alguém liberar. Por isso lá é 1 conexão, devolvida logo.
 */
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
const serverless = Boolean(process.env.VERCEL);

export function db(): postgres.Sql {
  globalForDb.sql ??= postgres(env.databaseUrl(), {
    prepare: false,
    max: serverless ? 1 : 5,
    idle_timeout: serverless ? 5 : 20,
    connect_timeout: 10,
  });
  return globalForDb.sql;
}

/**
 * Leitura para página pública: nunca derruba nem trava a página. Sem banco,
 * com erro ou passando de `ms`, devolve `fallback` — no build, a página sai
 * como "em breve" e se corrige na próxima revalidação.
 */
export async function tolerant<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T,
  ms = 8_000,
): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`sem resposta em ${ms} ms`)),
          ms,
        );
      }),
    ]);
  } catch (error) {
    console.warn(
      `${label} indisponível`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
