import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/**
 * CSP do site público. É estática porque as páginas são estáticas (SEO e
 * velocidade), e nonce exigiria renderizar cada visita. O painel (/admin)
 * usa uma CSP mais estrita, com nonce, definida em src/proxy.ts.
 */
const publicCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Valem para todas as respostas, inclusive API e painel. */
const securityHeaders = [
  // Dois anos de HTTPS obrigatório, subdomínios incluídos.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Não anuncia o framework no cabeçalho X-Powered-By.
  poweredByHeader: false,
  // O certificado lê o logotipo do disco; sem isto o arquivo não entra no
  // pacote da função na Vercel.
  outputFileTracingIncludes: {
    "/certificado/[token]": ["./public/brand/tkxhi-wordmark.png"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Tudo menos o painel, que recebe a CSP com nonce do proxy.
        source: "/((?!admin).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
