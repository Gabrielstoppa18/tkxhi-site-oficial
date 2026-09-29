import "server-only";
import { siteConfig } from "@/lib/site-config";

/**
 * Variáveis de ambiente do fluxo de cursos e do painel.
 *
 * - Lidas sob demanda, não no carregamento do módulo: o build do site
 *   institucional não pode quebrar num ambiente sem banco configurado.
 * - Validadas no uso: formato e tamanho mínimo de cada segredo. Um segredo
 *   fraco derruba a função em vez de rodar inseguro.
 * - Nunca com prefixo NEXT_PUBLIC_: nada daqui pode chegar ao navegador.
 *   O `import "server-only"` quebra o build se alguém tentar.
 *
 * A lista completa está em docs/cursos.md e o `.env` é preenchido com
 * `npm run setup`.
 */
class EnvError extends Error {}

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = read(name);
  if (!value) {
    throw new EnvError(
      `Variável de ambiente ausente: ${name}. Rode "npm run setup" ou veja docs/cursos.md.`,
    );
  }
  return value;
}

/** Chave de 32 bytes em base64url/base64 — gerada por `npm run setup`. */
function key32(name: string, optional = false): Buffer | undefined {
  const value = optional ? read(name) : required(name);
  if (!value) return undefined;
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length !== 32) {
    throw new EnvError(
      `${name} precisa ter 32 bytes em base64url. Gere com "npm run setup".`,
    );
  }
  return bytes;
}

function secret(name: string, minLength: number): string {
  const value = required(name);
  if (value.length < minLength) {
    throw new EnvError(
      `${name} precisa ter pelo menos ${minLength} caracteres.`,
    );
  }
  return value;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  /**
   * Schema do Postgres deste ambiente. Dev e produção usam o mesmo banco com
   * schemas separados (ex.: "public" no dev, "prod" na produção).
   */
  databaseSchema: () => {
    const value = read("DATABASE_SCHEMA") ?? "public";
    if (!/^[a-z_][a-z0-9_]{0,30}$/.test(value)) {
      throw new EnvError(
        "DATABASE_SCHEMA: só letras minúsculas, números e _ (ex.: prod).",
      );
    }
    return value;
  },

  mpAccessToken: () => secret("MP_ACCESS_TOKEN", 20),
  mpWebhookSecret: () => secret("MP_WEBHOOK_SECRET", 16),

  /**
   * Segredo-mestre das assinaturas (links de reembolso). As chaves de cada
   * finalidade são derivadas dele por HKDF — ver crypto.ts. O anterior fica
   * aceito só para verificação durante uma rotação.
   */
  appSecret: () => key32("APP_SECRET")!,
  appSecretPrevious: () => key32("APP_SECRET_PREVIOUS", true),

  /**
   * Chave de cifragem de dados em repouso (CPF, segredos 2FA). Diferente do
   * APP_SECRET de propósito: esta não pode ser trocada sem recifrar o banco.
   */
  dataKey: () => key32("DATA_ENCRYPTION_KEY")!,
  dataKeyPrevious: () => key32("DATA_ENCRYPTION_KEY_PREVIOUS", true),

  /** Master: usuário, hash scrypt da senha e segredo TOTP. Sem os três, o login do master fica desligado. */
  master: () => {
    const username = read("ADMIN_MASTER_USERNAME")?.toLowerCase();
    const passwordHash = read("ADMIN_MASTER_PASSWORD_HASH");
    const totpSecret = read("ADMIN_MASTER_TOTP_SECRET");
    if (!username || !passwordHash || !totpSecret) return null;
    return { username, passwordHash, totpSecret };
  },

  /** Sem chave, os e-mails vão para o console — só fora de produção. */
  resendApiKey: () => {
    const value = read("RESEND_API_KEY");
    if (!value && process.env.NODE_ENV === "production") {
      throw new EnvError("RESEND_API_KEY é obrigatória em produção.");
    }
    return value;
  },
  emailFrom: () =>
    read("EMAIL_FROM") ?? `${siteConfig.name} <${siteConfig.contact.email}>`,
  adminNotifyEmails: () =>
    (read("ADMIN_NOTIFY_EMAIL") ?? siteConfig.contact.email)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
};

/** Nomes das variáveis obrigatórias ausentes — para o aviso no boot. Nunca os valores. */
export function missingEnv(): string[] {
  const names = [
    "DATABASE_URL",
    "MP_ACCESS_TOKEN",
    "MP_WEBHOOK_SECRET",
    "APP_SECRET",
    "DATA_ENCRYPTION_KEY",
    "ADMIN_MASTER_USERNAME",
    "ADMIN_MASTER_PASSWORD_HASH",
    "ADMIN_MASTER_TOTP_SECRET",
  ];
  if (process.env.NODE_ENV === "production")
    names.push("RESEND_API_KEY", "EMAIL_FROM");
  return names.filter((name) => !read(name));
}

/**
 * URL pública desta instalação, para links em e-mail, QR code e retorno do
 * Mercado Pago. Em preview da Vercel aponta para o próprio deploy.
 */
export function appUrl(): string {
  const configured = read("APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return siteConfig.url;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const isProduction = () => process.env.NODE_ENV === "production";
