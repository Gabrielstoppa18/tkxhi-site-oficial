import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP estrita, com nonce por requisição, só no painel. Ali um script injetado
 * poderia aprovar reembolsos ou criar admins, então só roda script com o
 * nonce desta resposta.
 *
 * O site público fica com a CSP estática de next.config.ts: nonce exige
 * renderização dinâmica, e as páginas públicas são estáticas por causa de
 * SEO e velocidade. Elas não têm login nem dados sensíveis na tela.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Atributos style="" vindos do React e do Motion exigem 'unsafe-inline';
    // estilo não executa código, o risco fica no script, que está travado.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/admin/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
