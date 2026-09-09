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
  // SUPOSIÇÃO: o site no ar não publica nenhum canal de contato. Este endereço
  // é o padrão do domínio e precisa ser confirmado antes de ir ao ar.
  contact: {
    email: "contato@tkxhi.com",
    whatsapp: "",
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
] as const;

// TODO: migrar o texto jurídico para rotas próprias. Enquanto isso os links
// apontam para as páginas que já estão publicadas, para não gerar 404.
export const legalNav = [
  { href: "https://tkxhi.com/termos-de-uso/", label: "Termos de uso" },
  {
    href: "https://tkxhi.com/politica-de-privacidade/",
    label: "Política de Privacidade",
  },
] as const;

export type SiteConfig = typeof siteConfig;
