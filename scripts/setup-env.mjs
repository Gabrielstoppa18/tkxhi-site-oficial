// Preenche o .env local com os segredos gerados nesta máquina.
//
//   npm run setup                      gera o que falta e configura o master
//   npm run setup -- --master          refaz usuário, senha e 2FA do master
//   npm run setup -- --rotate-app-secret
//                                      troca o APP_SECRET (o anterior segue
//                                      aceito em APP_SECRET_PREVIOUS)
//
// Nada é enviado para lugar nenhum e nenhum segredo é impresso, exceto o QR
// do 2FA do master — que só aparece na configuração, para você escanear.
import { createHmac, randomBytes, scrypt } from "node:crypto";
import { chmod, copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import QRCode from "qrcode";

const ENV_PATH = new URL("../.env", import.meta.url);
const TEMPLATE_PATH = new URL("../env.template", import.meta.url);
const args = new Set(process.argv.slice(2));

// ---- .env ------------------------------------------------------------------

if (!existsSync(ENV_PATH)) {
  await copyFile(TEMPLATE_PATH, ENV_PATH);
  console.log(".env criado a partir de env.template.");
}
let text = await readFile(ENV_PATH, "utf8");

function get(key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^"(.*)"$/, "$1") : "";
}

function set(key, value) {
  if (/[\s"'$`\\#]/.test(value)) throw new Error(`Valor inválido para ${key}`);
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  text = pattern.test(text)
    ? text.replace(pattern, line)
    : `${text.trimEnd()}\n${line}\n`;
}

const key32 = () => randomBytes(32).toString("base64url");

// ---- prompts ----------------------------------------------------------------

// Uma interface por pergunta: um readline aberto durante a senha ecoaria as teclas.
async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Lê sem ecoar os caracteres. Sem terminal interativo, recusa em vez de expor a senha. */
function askHidden(question) {
  if (!process.stdin.isTTY) {
    console.error(
      "\nPara digitar a senha com segurança, rode num terminal interativo (PowerShell, Terminal do VS Code).",
    );
    process.exit(1);
  }
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = "";
    const onData = (chunk) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.off("data", onData);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(130); // Ctrl+C
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}

// ---- senha (mesmos parâmetros de src/lib/server/password.ts) ----------------

function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      32,
      { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) =>
        error
          ? reject(error)
          : resolve(
              [
                "scrypt",
                17,
                8,
                1,
                salt.toString("base64url"),
                key.toString("base64url"),
              ].join(":"),
            ),
    );
  });
}

// ---- TOTP (mesmo algoritmo de src/lib/server/totp.ts) -----------------------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(bytes) {
  let bits = 0,
    value = 0,
    out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function unbase32(input) {
  let bits = 0,
    value = 0;
  const out = [];
  for (const char of input) {
    value = (value << 5) | B32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function totp(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", unbase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1e6).padStart(
    6,
    "0",
  );
}
function totpOk(secret, code) {
  const now = Math.floor(Date.now() / 30000);
  return [now - 1, now, now + 1].some(
    (step) => totp(secret, step) === code.trim(),
  );
}

// ---- execução ---------------------------------------------------------------

const changed = [];

for (const name of ["APP_SECRET", "DATA_ENCRYPTION_KEY"]) {
  if (!get(name)) {
    set(name, key32());
    changed.push(name);
  }
}

if (args.has("--rotate-app-secret")) {
  set("APP_SECRET_PREVIOUS", get("APP_SECRET"));
  set("APP_SECRET", key32());
  changed.push("APP_SECRET", "APP_SECRET_PREVIOUS");
}

const masterMissing =
  !get("ADMIN_MASTER_USERNAME") ||
  !get("ADMIN_MASTER_PASSWORD_HASH") ||
  !get("ADMIN_MASTER_TOTP_SECRET");

if (masterMissing || args.has("--master")) {
  console.log("\nConfiguração do admin master (quem cria os outros admins).\n");

  let username = "";
  while (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    username = (
      await ask("Usuário do master (minúsculas, 3 a 32 caracteres): ")
    ).toLowerCase();
  }

  let password = "";
  for (;;) {
    password = await askHidden("Senha do master (mínimo 14 caracteres): ");
    if (password.length < 14) {
      console.log("  Curta demais.");
      continue;
    }
    if (password.toLowerCase().includes(username)) {
      console.log("  Não use o nome de usuário na senha.");
      continue;
    }
    if ((await askHidden("Repita a senha: ")) !== password) {
      console.log("  As senhas não conferem.");
      continue;
    }
    break;
  }

  const secret = base32(randomBytes(20));
  const uri = `otpauth://totp/${encodeURIComponent(`TkxHi:${username}`)}?secret=${secret}&issuer=TkxHi&algorithm=SHA1&digits=6&period=30`;
  console.log(
    "\nEscaneie no app autenticador (Google Authenticator, Authy, 1Password):\n",
  );
  console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
  console.log(
    `Sem câmera? Chave de configuração: ${secret.replace(/(.{4})/g, "$1 ").trim()}\n`,
  );

  for (;;) {
    const code = await ask("Digite o código de 6 dígitos que aparece no app: ");
    if (totpOk(secret, code)) break;
    console.log(
      "  Código não confere. Veja se o relógio do celular está certo e tente o próximo.",
    );
  }

  process.stdout.write("Gerando o hash da senha... ");
  set("ADMIN_MASTER_USERNAME", username);
  set("ADMIN_MASTER_PASSWORD_HASH", await hashPassword(password));
  set("ADMIN_MASTER_TOTP_SECRET", secret);
  console.log("pronto.");
  changed.push(
    "ADMIN_MASTER_USERNAME",
    "ADMIN_MASTER_PASSWORD_HASH",
    "ADMIN_MASTER_TOTP_SECRET",
  );
}

if (changed.length === 0) {
  console.log(
    "Nada a gerar: os segredos já estão preenchidos. Use --master ou --rotate-app-secret para trocar.",
  );
  process.exit(0);
}

await writeFile(ENV_PATH, text, { encoding: "utf8", mode: 0o600 });
await chmod(ENV_PATH, 0o600).catch(() => {});

console.log(`\nAtualizado em .env: ${[...new Set(changed)].join(", ")}.`);
const pending = [
  "DATABASE_URL",
  "MP_ACCESS_TOKEN",
  "MP_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
].filter((name) => !get(name));
if (pending.length)
  console.log(`Ainda falta preencher à mão: ${pending.join(", ")}.`);
console.log(
  'Em produção, cadastre cada variável na Vercel como "Sensitive" — veja docs/cursos.md.',
);
