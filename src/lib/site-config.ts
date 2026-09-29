/**
 * Fonte única de verdade para identidade, contato e navegação.
 * Metadata, header, footer e JSON-LD leem daqui — não repita esses valores.
 */
export const siteConfig = {
  name: "TkxHi",
  tagline: "Descomplicando a Tecnologia",
  description:
    "Engenharia, impressão 3D e editora técnica sob o mesmo teto. A TkxHi leva uma ideia de projeto a peça produzida e conhecimento registrado.",
  url: "https://tkxhi.com",
  locale: "pt-BR",
  cnpj: "51.860.522/0001-02",
  contact: {
    email: "tkxhi.oficial@gmail.com",
    // Formato internacional, só dígitos: 55 (Brasil) + 64 (DDD) + número.
    // Vazio esconde o botão de WhatsApp no site inteiro.
    whatsapp: "556420910881",
    /** Como o número aparece para quem lê. */
    phoneDisplay: "(64) 2091-0881",
    whatsappMessage:
      "Olá! Vim pelo site da TkxHi e quero falar sobre um projeto.",
  },
  links: {
    instagram: "",
    linkedin: "",
  },
} as const;

export const mainNav = [
  { href: "/engenharia", label: "Engenharia" },
  { href: "/impressao-3d", label: "Impressão 3D" },
  { href: "/editora", label: "Editora" },
  { href: "/cursos", label: "Cursos" },
] as const;

export const legalNav = [
  { href: "/termos-de-uso", label: "Termos de uso" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
] as const;

export type SiteConfig = typeof siteConfig;

/** Link do WhatsApp com mensagem inicial, ou null se o número não estiver configurado. */
export function whatsappUrl(): string | null {
  const digits = siteConfig.contact.whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(siteConfig.contact.whatsappMessage);
  return `https://wa.me/${digits}?text=${text}`;
}
