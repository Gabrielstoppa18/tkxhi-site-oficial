import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/server/env";

/**
 * Integração com o Checkout Pro do Mercado Pago, direto na API REST — o SDK
 * oficial não acrescenta nada para as quatro chamadas que o fluxo usa.
 *
 * Referências:
 * - Preferência: POST /checkout/preferences
 * - Pagamento:   GET  /v1/payments/{id}
 * - Reembolso:   POST /v1/payments/{id}/refunds (total sem corpo, parcial com `amount`)
 * - Assinatura do webhook: x-signature "ts=…,v1=…", HMAC-SHA256 sobre
 *   "id:{data.id};request-id:{x-request-id};ts:{ts};"
 *
 * O Checkout Pro gera pagamentos, não "orders": por isso o reembolso vai em
 * /v1/payments/{id}/refunds, e não em /v1/orders/{id}/refund (que é da API de
 * Orders, usada no checkout transparente).
 */
const API = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
  }
}

async function mp<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${env.mpAccessToken()}`);
  headers.set("Content-Type", "application/json");
  if (init.idempotencyKey)
    headers.set("X-Idempotency-Key", init.idempotencyKey);

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MercadoPagoError(
      `Mercado Pago ${init.method ?? "GET"} ${path} respondeu ${response.status}`,
      response.status,
      body,
    );
  }
  return body as T;
}

export type Preference = { id: string; init_point: string };

export async function createPreference(input: {
  enrollmentId: string;
  courseSlug: string;
  title: string;
  amountCents: number;
  buyer: { name: string; email: string; cpf: string };
  backUrl: string;
  expiresAt: Date;
}): Promise<Preference> {
  // O Mercado Pago recusa auto_return com back_url em localhost.
  const publicUrl = input.backUrl.startsWith("https://");

  return mp<Preference>("/checkout/preferences", {
    method: "POST",
    idempotencyKey: `preference-${input.enrollmentId}`,
    body: JSON.stringify({
      items: [
        {
          id: input.courseSlug,
          title: input.title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: input.amountCents / 100,
        },
      ],
      payer: {
        name: input.buyer.name,
        email: input.buyer.email,
        identification: { type: "CPF", number: input.buyer.cpf },
      },
      external_reference: input.enrollmentId,
      back_urls: {
        success: input.backUrl,
        pending: input.backUrl,
        failure: input.backUrl,
      },
      ...(publicUrl ? { auto_return: "approved" } : {}),
      // Boleto e lotérica compensam em dias, e a vaga só fica reservada pelo
      // tempo da preferência: aceitar esses meios abriria espaço para overbooking.
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      expires: true,
      expiration_date_to: input.expiresAt.toISOString(),
      statement_descriptor: "TKXHI CURSO",
    }),
  });
}

export type Payment = {
  id: number;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  date_approved: string | null;
};

export function getPayment(id: string): Promise<Payment> {
  return mp<Payment>(`/v1/payments/${encodeURIComponent(id)}`);
}

export type Refund = { id: number; amount: number; status: string };

/** Sem `amountCents`, reembolsa o valor total. */
export function refundPayment(
  paymentId: string,
  idempotencyKey: string,
  amountCents?: number,
): Promise<Refund> {
  return mp<Refund>(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    idempotencyKey,
    body: JSON.stringify(
      amountCents === undefined ? {} : { amount: amountCents / 100 },
    ),
  });
}

/**
 * Não há janela de validade sobre o `ts`: o Mercado Pago reenvia notificações
 * por horas quando a entrega falha, e repetir uma notificação legítima é
 * inofensivo — o webhook só usa o id para consultar a API, nunca o conteúdo.
 */
export function verifyWebhookSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  if (!input.signature) return false;

  const parts = Object.fromEntries(
    input.signature.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // A documentação pede o data.id em minúsculas quando é alfanumérico, e que
  // cada campo ausente saia do manifesto em vez de ir vazio.
  let manifest = "";
  if (input.dataId) manifest += `id:${input.dataId.toLowerCase()};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", env.mpWebhookSecret())
    .update(manifest)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
