import "server-only";

type HeaderSource = { get(name: string): string | null };

/**
 * IP de quem fez a requisição. Na Vercel, `x-forwarded-for` é reescrito pela
 * borda e o primeiro item é o cliente — um valor enviado pelo navegador não
 * chega até aqui.
 */
export function clientIp(headers: HeaderSource): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "desconhecido";
}

export function userAgent(headers: HeaderSource): string | null {
  return headers.get("user-agent")?.slice(0, 500) ?? null;
}
