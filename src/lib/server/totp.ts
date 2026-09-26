import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { siteConfig } from "@/lib/site-config";
import { db } from "@/lib/server/db";
import { safeEqual } from "@/lib/server/crypto";

/**
 * Segundo fator por TOTP (RFC 6238): SHA-1, 6 dígitos, passo de 30 s — o
 * padrão que Google Authenticator, Authy e 1Password entendem.
 *
 * Aceita um passo de tolerância para cada lado (relógio do celular
 * adiantado ou atrasado) e grava o último passo usado por usuário, então o
 * mesmo código não serve duas vezes.
 */
const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$|\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Segredo TOTP inválido.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function codeAt(secret: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", secret).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Passo aceito, ou null. Não grava nada — ver `consumeTotp`. */
export function matchTotp(secretBase32: string, code: string): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(secretBase32);
  const now = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  let matched: number | null = null;
  // Percorre as três janelas sempre, para o tempo não denunciar qual bateu.
  for (const step of [now - 1, now, now + 1]) {
    if (safeEqual(codeAt(secret, step), clean) && matched === null) {
      matched = step;
    }
  }
  return matched;
}

/**
 * Confere o código e registra o passo como usado, numa única operação: dois
 * pedidos simultâneos com o mesmo código não passam os dois.
 */
export async function consumeTotp(
  principal: string,
  secretBase32: string,
  code: string,
): Promise<boolean> {
  const step = matchTotp(secretBase32, code);
  if (step === null) return false;
  const [row] = await db()`
    INSERT INTO totp_replay (principal, last_step) VALUES (${principal}, ${step})
    ON CONFLICT (principal) DO UPDATE SET last_step = EXCLUDED.last_step
    WHERE totp_replay.last_step < EXCLUDED.last_step
    RETURNING last_step
  `;
  return Boolean(row);
}

export function otpauthUri(username: string, secretBase32: string): string {
  const issuer = encodeURIComponent(siteConfig.name);
  const label = encodeURIComponent(`${siteConfig.name}:${username}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}
