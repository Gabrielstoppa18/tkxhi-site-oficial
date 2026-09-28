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

**3D e interação.** `<PartViewer />` monta uma engrenagem flangeada gerada por código (sem arquivo de modelo) que se constrói camada a camada — o mesmo argumento do hero, em três dimensões. O three.js entra por `next/dynamic` com `ssr: false` e fica fora do payload inicial: **nunca importe `@react-three/*` estaticamente numa página**, são ~230 KB comprimidos. A cena é declarativa de propósito (sem `useFrame` mutando objetos), porque o React Compiler rejeita mutação de valores capturados por hook.

**Três materiais, não só três cores.** Cada frente tem textura própria: `.material-draft` (malha de papel milimetrado, Engenharia), `.material-layered` (estrias de deposição, Impressão 3D), `.material-halftone` (retícula de meio-tom, Editora). Painéis que só mudam de cor leem como repetição; painéis que mudam de superfície leem como sistema. Nunca deixe dois painéis vizinhos com o mesmo material.

**A Editora é uma folha de prova.** Marcas de registro nos cantos, barra de tintas da marca na borda e o título fora de registro (`.misregistered`, fantasma ciano e magenta). Livro não é assunto sóbrio aqui: é onde a casa mostra que mistura arte e técnica. Não "limpe" essa seção.

**Fotos passam pela `<PhotoPlate />`,** nunca por um `<Image>` solto: canto chanfrado, duotone na cor da frente, retícula por cima e chapa fantasma deslocada atrás. Além de dar assinatura, o duotone resolve a paleta alheia que toda foto de banco carrega.

**`<Orbit />` é a vitrine de serviços** — três anéis girando, um por frente, nove nós. Mouse ou foco de teclado congela a órbita e abre o detalhe; sem interação, ele cicla sozinho. Substituiu uma grade em que fotos e diagramas de frentes diferentes se misturavam sem hierarquia.

**Ilustrações por nicho.** `<Schematic />`, `<LayerStack />` e `<PageSpread />` em `src/components/graphics/` são desenhos técnicos em SVG, um por frente, servidos dentro de `<MediaFrame />`. Quando as fotos reais existirem, passe `photo={{ src, alt }}` para a moldura — enquadramento, legenda e responsividade não mudam. Fotos a produzir: placa em bancada com instrumento à vista; peça saindo da impressora com camadas visíveis; livro ou manual aberto com luz lateral.

**Pulsos nas trilhas.** `<CircuitField animated />` acende corrente correndo pelo desenho. Use **um por página** — hoje só na de Engenharia, que é o nicho a que o motivo pertence.

**Assets de marca.** `public/brand/tkxhi-wordmark.png` é o lockup horizontal oficial, exportado do Canva e recortado na caixa do conteúdo — use sempre pelo `<Wordmark />`, nunca uma fonte imitando as letras. O ícone da aba (`src/app/icon.png`) é **provisório**: monta o lockup real dentro de um anel, porque a versão redonda do selo, com as trilhas de placa, ainda não chegou como arquivo. Substitua assim que chegar.

**Contato sai do `site-config.ts`.** `whatsappUrl()` devolve `null` quando não há número, e `<ContactActions />` simplesmente não desenha o botão — melhor nenhum botão do que um que abre conversa com ninguém. Não escreva link de WhatsApp direto em componente.

**Conteúdo real vem antes de conteúdo genérico.** As páginas internas mostram o que a casa de fato faz: o TurTle-T (robô com eletrônica, peças impressas e material didático) na Engenharia, a peça 3D na Impressão, a série Robótica Trip na Editora. Ao acrescentar conteúdo, prefira sempre um projeto existente a uma descrição abstrata de serviço.

**Não invente métricas.** A empresa é pequena e não publica números. Nada de "10k+ clientes" ou prova social fabricada.

## Cursos, pagamentos e painel

Venda de cursos presenciais com Mercado Pago (Checkout Pro), Postgres e Resend, mais o painel `/admin`. Fluxo, variáveis, rotação de segredos e modelo de segurança estão em **`docs/cursos.md`**. Regras que não se quebram:

- **Código de servidor fica em `src/lib/server/`**, sempre com `import "server-only"`. **Cursos** (conteúdo) e **turmas** (data, local, preço, vagas, política de reembolso) ficam no banco e são gerenciados em `/admin/cursos` e `/admin/turmas`. `src/lib/courses.ts` tem só tipos, ícones e o estilo de cada frente — é importado pelo navegador. Páginas públicas leem com as funções tolerantes (`publishedCourses`, `publicCourse`, `publicCohorts`): sem banco, a página cai em "em breve", nunca em erro.
- **Segredo nenhum com prefixo `NEXT_PUBLIC_`.** Variável nova passa por `src/lib/server/env.ts` (com validação) e entra em `env.template` e `docs/cursos.md`. O `.env` é gerado por `npm run setup`; nunca escreva segredo em código, log ou mensagem.
- **Cripto só por `src/lib/server/crypto.ts`**: HMAC com chave derivada por finalidade, AES-256-GCM com contexto (AAD). Nada de `createHmac` ou `createCipheriv` solto. Dado pessoal novo (documento, telefone) entra cifrado.
- **Toda página e server action do painel começa com `requireAdmin()`** (ou `requireMaster()` para gestão de usuários). O layout de `/admin` não protege nada.
- **O webhook nunca confia no payload**: valida o `x-signature` e consulta `GET /v1/payments/{id}`. Mudança de status passa por `syncPayment()`.
- **Tudo que altera matrícula, turma ou admin chama `audit()`.** A tabela `audit_log` recusa UPDATE, DELETE e TRUNCATE: é a evidência num chargeback.
- **Rota pública nova que escreve no banco ganha limite** em `src/lib/server/rate-limit.ts`.
- **Texto de ciência mudou? Troque `CONSENT_VERSION`** em `src/lib/consent.ts`. O servidor recalcula o texto; nunca grave o que o navegador mandar.
- **O sistema só reembolsa sozinho quando a resposta é sim** (`src/lib/refund-policy.ts`). Caso duvidoso vai para `manual_review`.
- **Não afrouxe a CSP do painel** (`src/proxy.ts`): script só com nonce.

## Design

Antes de criar ou revisar qualquer UI, use a skill **`ui-ux-pro-max`** (instalada como plugin) para escolher estilo, paleta, tipografia e checar as regras de UX/acessibilidade. Ela tem base local pesquisável e guidelines específicas para Next.js + Tailwind + shadcn.

Checagens que não são negociáveis: contraste ≥ 4.5:1, alvo de toque ≥ 44×44px, foco visível no teclado (nunca remover o ring), `alt` em toda imagem com significado, e respeito a `prefers-reduced-motion`.

## Pegadinhas conhecidas

- **Next.js 16 tem breaking changes** em relação ao que você "lembra": veja o bloco no topo de `AGENTS.md` e consulte `node_modules/next/dist/docs/` antes de escrever código de framework.
- **Tailwind v4 não usa arquivo de config.** Procurar `tailwind.config.ts` é perda de tempo — a configuração é CSS-first em `globals.css`.
- `AGENTS.md` contém um bloco gerado e reescrito pelo `next dev`. Não tente removê-lo; se aparecer como alteração não commitada, commite junto.

## Estado atual

Projeto recém-inicializado. A home (`src/app/page.tsx`) é um placeholder — identidade visual, conteúdo real e demais páginas ainda serão definidos. Os `TODO` em `src/lib/site-config.ts` (domínio, descrição, redes) precisam ser preenchidos antes do primeiro deploy.
