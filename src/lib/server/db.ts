import "server-only";
import postgres from "postgres";
import { env } from "@/lib/server/env";

/**
 * Cliente Postgres único por processo. `prepare: false` mantém compatibilidade
 * com o pooler em modo transação do Supabase e do Neon, que não suportam
 * prepared statements nomeados. Em desenvolvimento o cliente sobrevive ao
 * hot reload pelo globalThis, senão cada edição abriria uma conexão nova.
 */
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  globalForDb.sql ??= postgres(env.databaseUrl(), {
    prepare: false,
    max: 5,
    idle_timeout: 20,
  });
  return globalForDb.sql;
}
