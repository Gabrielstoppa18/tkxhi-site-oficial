@AGENTS.md

# TKXHI — Site Oficial

Site institucional / landing page da TKXHI. Público brasileiro, conteúdo em **pt-BR**.
Prioridades, nesta ordem: **SEO → performance → acessibilidade → estética**.

## Stack

| Camada      | Escolha                        | Nota                                                                                                                             |
| ----------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router)        | Server Components por padrão                                                                                                     |
| Linguagem   | TypeScript (strict)            |                                                                                                                                  |
| Estilo      | Tailwind CSS v4                | **Sem `tailwind.config`** — tokens ficam em `@theme` dentro de `src/app/globals.css`                                             |
| Componentes | shadcn/ui, estilo `radix-nova` | Código nosso em `src/components/ui/`                                                                                             |
| Ícones      | `lucide-react`                 | Nunca emoji como ícone                                                                                                           |
| Animação    | Motion (`motion`)              | Import de `motion/react`. **Não use `framer-motion`** — nome antigo do mesmo projeto, [renomeado](https://motion.dev/docs/react) |
| Deploy      | Vercel                         |                                                                                                                                  |

## Comandos

```bash
npm run dev     # servidor de desenvolvimento (Turbopack)
npm run build   # build de produção — rode antes de dar qualquer tarefa por concluída
npm run lint    # ESLint
npm run format  # Prettier (ordena classes do Tailwind)
```

## Estrutura

```
src/
  app/              # rotas (App Router). page.tsx, layout.tsx, not-found.tsx…
    globals.css     # tokens de design (@theme) + variáveis de tema claro/escuro
  components/
    ui/             # primitivas do shadcn — não editar à toa, são regeneráveis
    sections/       # blocos de página (Hero, Features, FAQ, CTA…)
  lib/
    site-config.ts  # nome, domínio, descrição e links — fonte única de verdade
    utils.ts        # re-export do cn() (pacote oficial `cn` do shadcn, substitui clsx + tailwind-merge)
public/             # imagens e assets estáticos
```

## Convenções

- **Server Component é o padrão.** Só use `"use client"` quando houver estado, efeito ou handler de evento — e coloque a diretiva no componente mais interno possível, não na página inteira.
- **Cores sempre por token semântico** (`bg-background`, `text-muted-foreground`, `border-border`). Nunca hex cru nem `text-gray-500` direto em componente. Cor nova entra como token em `globals.css`.
- **Toda seção de página vira um componente em `src/components/sections/`.** `page.tsx` só compõe seções.
- **Nome, domínio e descrição saem de `site-config.ts`.** Não duplique esses valores.
- **Imagens sempre com `next/image`**, com `width`/`height` ou `fill` + container dimensionado — evita layout shift (CLS).
- **Texto visível em pt-BR.** Nomes de variáveis, funções e arquivos em inglês.
- Página nova exporta `metadata` própria (título e descrição específicos). O `template` do título já está no layout raiz.

## Sistema visual

A tese do site: as três frentes da TkxHi são **três estados da mesma ideia** — projeto (Engenharia), matéria (Impressão 3D) e registro (Editora). Layout, cor e tipografia sustentam esse argumento; qualquer seção nova deve caber nele.

**A cor vem da identidade da marca.** O logotipo escreve TkxHi com uma cor por letra e a paleta se organiza em três famílias, que mapeiam nas três frentes:

| Frente       | Família | Claro (sobre escuro) | Escuro (sobre papel) |
| ------------ | ------- | -------------------- | -------------------- |
| Engenharia   | verde   | `#4dff73`            | `#18702e`            |
| Impressão 3D | laranja | `#fea520`            | `#cd5d01`            |
| Editora      | roxo    | `#d457c7`            | `#822ca3`            |

Fundo padrão: violeta quase preto `#190630`, derivado de `#250469` e `#350049`. Ação global: laranja `#fe7c20`.

**Não escreva cor de frente em componente.** Aplique a classe `.pillar-engenharia`, `.pillar-impressao-3d` ou `.pillar-editora` (vêm de `pillar.colorClass`) num container: ela troca `--primary` e `--ring`, e todo `text-primary` / `bg-primary` / `border-primary` dentro segue junto. Botões, foco e destaques se reconfiguram sem exceção no código.

**Dois registros materiais.** O padrão é tela (violeta escuro). A Editora usa `.register-paper`, que reescreve os tokens shadcn para a versão clara — combine com a classe da frente (`register-paper pillar-editora`) para o roxo escurecer e manter contraste. As cores do logotipo (`--mark-*`) também têm variante por registro, porque o roxo `#822ca3` sobre o violeta cai para 1,9:1 e some.

**Quatro famílias tipográficas, cada uma com um papel.** `font-display` (Archivo) só em títulos; `font-sans` (IBM Plex Sans) no corpo; `font-mono` (IBM Plex Mono) em rótulos, numeração e dados; `font-serif` (IBM Plex Serif) exclusivamente no registro papel. Não misture uma quinta fonte.

**Motivos de assinatura.** `<CircuitField />` reinterpreta as trilhas de placa do logotipo como atmosfera de fundo; `.extruded-type` recorta títulos em camadas de deposição e lê a cor da palavra em `--stria`. O momento animado forte é um só — o hero se construindo de baixo para cima, um verbo por frente, na cor da frente. Todo o resto usa `<Reveal>`; animação extra empobrece o efeito.

**Pendência de asset:** o logotipo oficial (o selo circular e o lockup horizontal) ainda não está em `public/`. O `<Wordmark />` reproduz a sequência de cores em tipografia enquanto isso — troque por SVG quando os arquivos chegarem.

**Não invente métricas.** A empresa é pequena e não publica números. Nada de "10k+ clientes" ou prova social fabricada.

## Design

Antes de criar ou revisar qualquer UI, use a skill **`ui-ux-pro-max`** (instalada como plugin) para escolher estilo, paleta, tipografia e checar as regras de UX/acessibilidade. Ela tem base local pesquisável e guidelines específicas para Next.js + Tailwind + shadcn.

Checagens que não são negociáveis: contraste ≥ 4.5:1, alvo de toque ≥ 44×44px, foco visível no teclado (nunca remover o ring), `alt` em toda imagem com significado, e respeito a `prefers-reduced-motion`.

## Pegadinhas conhecidas

- **Next.js 16 tem breaking changes** em relação ao que você "lembra": veja o bloco no topo de `AGENTS.md` e consulte `node_modules/next/dist/docs/` antes de escrever código de framework.
- **Tailwind v4 não usa arquivo de config.** Procurar `tailwind.config.ts` é perda de tempo — a configuração é CSS-first em `globals.css`.
- `AGENTS.md` contém um bloco gerado e reescrito pelo `next dev`. Não tente removê-lo; se aparecer como alteração não commitada, commite junto.

## Estado atual

Projeto recém-inicializado. A home (`src/app/page.tsx`) é um placeholder — identidade visual, conteúdo real e demais páginas ainda serão definidos. Os `TODO` em `src/lib/site-config.ts` (domínio, descrição, redes) precisam ser preenchidos antes do primeiro deploy.
