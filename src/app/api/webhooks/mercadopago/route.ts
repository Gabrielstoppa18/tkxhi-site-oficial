import { audit } from "@/lib/server/audit";
import { verifyWebhookSignature } from "@/lib/server/mercadopago";
import { syncPayment } from "@/lib/server/payments";
import { clientIp } from "@/lib/server/request";

/**
 * Notificações do Mercado Pago. Configure a URL no painel (Suas integrações →
 * Webhooks → evento "Pagamentos"): é lá que se gera o segredo da assinatura.
 *
 * 1. Valida o x-signature. Sem assinatura válida, 401 e nada muda.
 * 2. Usa só o id do pagamento — o estado vem de uma consulta à API.
 * 3. Responde 200 rápido; erro na consulta devolve 500 para o MP tentar de novo.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  } | null;

  // O manifesto da assinatura usa o data.id da query string.
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type =
    url.searchParams.get("type") ?? body?.type ?? url.searchParams.get("topic");
  const ip = clientIp(request.headers);

  const valid = verifyWebhookSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!valid) {
    await audit({
      actor: "webhook",
      action: "webhook_rejected",
      ip,
      details: { reason: "assinatura inválida", type, dataId },
    });
    return new Response("assinatura inválida", { status: 401 });
  }

  await audit({
    actor: "webhook",
    action: "webhook_received",
    ip,
    details: { type, action: body?.action, dataId },
  });

  if (type !== "payment" || !dataId) {
    return new Response(null, { status: 200 });
  }

  try {
    await syncPayment(dataId, "webhook");
  } catch (error) {
    console.error("Falha ao sincronizar pagamento", dataId, error);
    return new Response("erro ao consultar o pagamento", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
