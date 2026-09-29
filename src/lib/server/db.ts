import "server-only";
import postgres from "postgres";
import { env } from "@/lib/server/env";

/**
 * Cliente Postgres único por processo. Em desenvolvimento o cliente sobrevive
 * ao hot reload pelo globalThis, senão cada edição abriria uma conexão nova.
 *
 * **Supabase: use o pooler em modo sessão (porta 5432), nunca o de modo
 * transação (6543).** Este driver envia várias consultas seguidas na mesma
 * conexão (pipelining), e o pooler em modo transação não responde a elas:
 * medido no banco de dev, 58 de 60 consultas ficaram sem resposta na 6543 e
 * todas responderam em menos de meio segundo na 5432. Por isso `db()` recusa
 * a 6543 com um erro claro em vez de travar em silêncio.
 *
 * `connect_timeout` curto: uma conexão pendurada não segura a requisição (ou
 * o build) por muito tempo.
 *
 * Na Vercel, cada instância serverless (e cada processo do build) tem o seu
 * cliente, e no modo sessão cada conexão aberta ocupa uma vaga do pooler. Por
 * isso lá é 1 conexão, devolvida após 5 segundos parada.
 */
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
const serverless = Boolean(process.env.VERCEL);

function assertCompatible(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (
    parsed.hostname.endsWith(".pooler.supabase.com") &&
    parsed.port === "6543"
  ) {
    throw new Error(
      "DATABASE_URL usa o pooler do Supabase em modo transação (porta 6543), que trava com este driver. Troque para a porta 5432 (modo sessão). Ver docs/cursos.md.",
    );
  }
}

/**
 * Schema errado detectado: a partir daí, nenhuma consulta passa. Melhor o
 * painel fora do ar do que a produção gravando nas tabelas do dev.
 */
let schemaMismatch: string | null = null;

export function db(): postgres.Sql {
  if (schemaMismatch) throw new Error(schemaMismatch);
  if (globalForDb.sql) return globalForDb.sql;
  const url = env.databaseUrl();
  assertCompatible(url);
  const schema = env.databaseSchema();
  const sql = postgres(url, {
    prepare: false,
    max: serverless ? 1 : 5,
    idle_timeout: serverless ? 5 : 20,
    connect_timeout: 10,
    // Dev e produção dividem o banco em schemas separados. O search_path tem
    // só o schema do ambiente — nunca "public" como reserva —, então uma
    // tabela que falte na produção dá erro em vez de ler os dados do dev.
    // Conferido no pooler do Supabase (modo sessão): o parâmetro é aplicado.
    connection: { search_path: schema },
  });
  globalForDb.sql = sql;

  // Defesa extra: se algum dia o parâmetro for ignorado em silêncio (outro
  // pooler, outro provedor), a primeira conexão denuncia e o app para de
  // consultar. Sem o schema criado, current_schema() volta nulo — também
  // conta como erro: falta rodar a migração daquele schema.
  void sql`SELECT current_schema() AS current`
    .then(([row]) => {
      if (row?.current !== schema) {
        schemaMismatch = `Conexão caiu no schema "${row?.current ?? "nenhum"}", esperado "${schema}". Rode "npm run db:migrate -- --schema=${schema}" e confira DATABASE_SCHEMA.`;
        console.error(`[tkxhi] ${schemaMismatch}`);
      }
    })
    .catch(() => {});
  return sql;
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
