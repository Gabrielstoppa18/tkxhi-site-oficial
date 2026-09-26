// Aplica db/schema.sql no banco de DATABASE_URL. Uso: npm run db:migrate
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL (ex.: no .env.local) antes de migrar.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
const schema = await readFile(
  new URL("../db/schema.sql", import.meta.url),
  "utf8",
);

try {
  await sql.unsafe(schema);
  console.log("Schema aplicado.");
} finally {
  await sql.end();
}
