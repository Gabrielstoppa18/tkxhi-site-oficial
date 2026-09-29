import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Senhas com scrypt nos parâmetros mínimos da OWASP (N=2^17, r=8, p=1).
 * Formato: `scrypt:<log2N>:<r>:<p>:<sal>:<hash>` em base64url — sem `$`,
 * que o carregador de .env do Next interpretaria como variável.
 *
 * scripts/setup-env.mjs gera o hash do master com os mesmos parâmetros.
 */
const LOG2N = 17;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
// 128 * N * r = 128 MiB; a margem evita o erro de limite de memória do Node.
const MAX_MEM = 256 * 1024 * 1024;

function derive(
  password: string,
  salt: Buffer,
  log2n: number,
  r: number,
  p: number,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      keyLength,
      { N: 2 ** log2n, r, p, maxmem: MAX_MEM },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, LOG2N, R, P, KEY_LENGTH);
  return [
    "scrypt",
    LOG2N,
    R,
    P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join(":");
}

/** Hash de mentira com os mesmos parâmetros: usuário inexistente custa o mesmo tempo. */
const DUMMY = `scrypt:${LOG2N}:${R}:${P}:${Buffer.alloc(16).toString("base64url")}:${Buffer.alloc(KEY_LENGTH).toString("base64url")}`;

export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  const [scheme, log2n, r, p, salt, hash] = (stored ?? DUMMY).split(":");
  const params = [Number(log2n), Number(r), Number(p)];
  if (
    scheme !== "scrypt" ||
    !salt ||
    !hash ||
    params.some((value) => !Number.isInteger(value)) ||
    params[0] < 14 ||
    params[0] > 20
  ) {
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64url"),
    params[0],
    params[1],
    params[2],
    expected.length,
  );
  return (
    stored !== undefined && stored !== null && timingSafeEqual(actual, expected)
  );
}

/**
 * Política de senha (NIST 800-63B): comprimento conta mais que regra de
 * símbolo. Devolve a mensagem de erro, ou null se a senha serve.
 */
export function passwordProblem(
  password: string,
  username: string,
): string | null {
  if (password.length < 12)
    return "A senha precisa ter pelo menos 12 caracteres.";
  if (password.length > 128)
    return "A senha pode ter no máximo 128 caracteres.";
  if (password.toLowerCase().includes(username.toLowerCase())) {
    return "A senha não pode conter o nome de usuário.";
  }
  if (new Set(password).size < 6) return "A senha repete caracteres demais.";
  if (
    /^(.)\1+$|^(0123456789|123456789|qwertyuiop|abcdefghij)/i.test(password)
  ) {
    return "Essa senha é previsível demais.";
  }
  return null;
}

/** Senha temporária para um admin novo: 20 caracteres sem ambiguidade (sem 0/O, 1/l). */
export function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out.replace(/(.{5})(?=.)/g, "$1-");
}
