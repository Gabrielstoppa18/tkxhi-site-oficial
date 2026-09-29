// Aplica db/schema.sql no banco de DATABASE_URL, dentro do schema de
// DATABASE_SCHEMA (padrão "public"). Uso:
//
//   npm run db:migrate                          schema do .env
//   npm run db:migrate -- --schema=prod         outro schema (ex.: produção)
//
// Dev e produção podem dividir o mesmo banco com schemas separados.
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL (ex.: no .env) antes de migrar.");
  process.exit(1);
}

const arg = process.argv.find((item) => item.startsWith("--schema="));
const schema = arg
  ? arg.slice("--schema=".length)
  : process.env.DATABASE_SCHEMA || "public";
if (!/^[a-z_][a-z0-9_]{0,30}$/.test(schema)) {
  console.error(
    `Schema inválido: "${schema}". Use letras minúsculas, números e _.`,
  );
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
  onnotice: () => {},
  connection: { search_path: schema },
});
const ddl = await readFile(
  new URL("../db/schema.sql", import.meta.url),
  "utf8",
);

try {
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await sql.unsafe(`SET search_path TO "${schema}"`);
  await sql.unsafe(ddl);
  console.log(`Schema aplicado em "${schema}".`);
} finally {
  await sql.end();
}
