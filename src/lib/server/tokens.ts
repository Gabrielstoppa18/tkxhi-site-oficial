import "server-only";
import { hmac, randomToken, verifyHmac } from "@/lib/server/crypto";

/**
 * Link de reembolso enviado por e-mail. Quem tem o link tem acesso ao pedido,
 * então a busca pública nunca mostra dados na tela: envia o link para o
 * e-mail cadastrado. Vale 72 h e é assinado com a chave "link-signing",
 * derivada do APP_SECRET.
 *
 * Formato: base64url(JSON).base64url(HMAC-SHA256).
 */
type Payload = { e: string; p: "refund"; x: number };

export function createRefundToken(enrollmentId: string, ttlHours = 72): string {
  const payload: Payload = {
    e: enrollmentId,
    p: "refund",
    x: Date.now() + ttlHours * 3_600_000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${hmac("link-signing", data)}`;
}

export function readRefundToken(token: string): string | null {
  if (token.length > 400) return null;
  const [data, mac] = token.split(".");
  if (!data || !mac || !verifyHmac("link-signing", data, mac)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString(),
    ) as Payload;
    if (payload.p !== "refund" || payload.x < Date.now()) return null;
    return payload.e;
  } catch {
    return null;
  }
}

/**
 * Valores aleatórios guardados na matrícula: o do QR de check-in e o do link
 * do certificado. Não dependem do APP_SECRET, então uma rotação de segredo
 * não invalida certificados já enviados.
 */
export function createOpaqueToken(): string {
  return randomToken(24);
}

export function isOpaqueToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(value);
}
