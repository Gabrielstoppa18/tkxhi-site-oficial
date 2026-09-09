# TKXHI — Site Oficial

Site institucional da TKXHI. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui.

## Rodando localmente

Requer Node.js 20+ (testado com 24.13).

```bash
npm install
npm run dev
```

Abre em <http://localhost:3000>.

## Scripts

| Comando             | O que faz                                       |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento com Turbopack       |
| `npm run build`     | Build de produção                               |
| `npm start`         | Sobe o build de produção                        |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | Checagem de tipos sem emitir arquivos           |
| `npm run format`    | Prettier, com ordenação das classes do Tailwind |

## Estrutura

```
src/
  app/              rotas do App Router; globals.css guarda os tokens de design
  components/ui/    primitivas do shadcn/ui
  components/sections/  blocos de página (Hero, Features, FAQ…)
  lib/site-config.ts    nome, domínio, descrição e links do site
public/             assets estáticos
```

## Adicionando componentes do shadcn

```bash
npx shadcn@latest add <componente>
```

## Antes do primeiro deploy

Preencher os `TODO` em `src/lib/site-config.ts` — o domínio de produção alimenta `metadataBase`, o `sitemap.xml` e o `robots.txt`.

## Trabalhando com o Claude Code

As convenções do projeto estão em [CLAUDE.md](CLAUDE.md); permissões e configuração compartilhada, em [.claude/settings.json](.claude/settings.json).
