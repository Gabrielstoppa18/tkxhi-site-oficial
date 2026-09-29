import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@/lib/server/env";

/**
 * Primitivas criptográficas do app, num lugar só.
 *
 * - Separação de chaves: cada finalidade usa uma chave própria derivada por
 *   HKDF-SHA256. Uma assinatura de link nunca valida como outra coisa.
 * - Cifragem em repouso: AES-256-GCM com IV aleatório e dado associado (AAD)
 *   que amarra o texto cifrado ao seu contexto — um CPF cifrado copiado para
 *   outra coluna não decifra.
 * - Rotação: `*_PREVIOUS` continua aceito para verificar e decifrar.
 */
export type KeyPurpose = "link-signing";

function derive(master: Buffer, purpose: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", master, Buffer.alloc(0), `tkxhi:${purpose}:v1`, 32),
  );
}

function signingKeys(purpose: KeyPurpose): Buffer[] {
  const keys = [derive(env.appSecret(), purpose)];
  const previous = env.appSecretPrevious();
  if (previous) keys.push(derive(previous, purpose));
  return keys;
}

export function hmac(purpose: KeyPurpose, data: string): string {
  return createHmac("sha256", signingKeys(purpose)[0])
    .update(data)
    .digest("base64url");
}

/** Confere contra a chave atual e, durante uma rotação, contra a anterior. */
export function verifyHmac(
  purpose: KeyPurpose,
  data: string,
  mac: string,
): boolean {
  const received = Buffer.from(mac);
  return signingKeys(purpose).some((key) => {
    const expected = Buffer.from(
      createHmac("sha256", key).update(data).digest("base64url"),
    );
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  });
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Contexto que vai como AAD: define onde um texto cifrado pode ser usado. */
export type CipherContext = "cpf" | "totp";

const VERSION = "v1";

function dataKeys(): Buffer[] {
  const keys = [derive(env.dataKey(), "data-encryption")];
  const previous = env.dataKeyPrevious();
  if (previous) keys.push(derive(previous, "data-encryption"));
  return keys;
}

export function encrypt(plaintext: string, context: CipherContext): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dataKeys()[0], iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, body, tag]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(".");
}

export function decrypt(payload: string, context: CipherContext): string {
  const [version, iv, body, tag] = payload.split(".");
  if (version !== VERSION || !iv || !body || !tag) {
    throw new Error("Texto cifrado em formato desconhecido.");
  }
  for (const key of dataKeys()) {
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(iv, "base64url"),
      );
      decipher.setAAD(Buffer.from(context));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([
        decipher.update(Buffer.from(body, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      // Tenta a próxima chave (rotação em andamento).
    }
  }
  throw new Error(
    "Não foi possível decifrar: chave errada ou dado adulterado.",
  );
}
