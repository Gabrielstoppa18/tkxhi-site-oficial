# Cursos: catálogo, turmas, matrícula, check-in, reembolso e certificado

Fluxo completo da venda de cursos presenciais, do cadastro do curso ao
certificado, e o modelo de segurança que o protege.

```
/admin/cursos ──► curso "publicado" ──► /cursos (catálogo), home e página da frente
/admin/turmas ──► turma "aberta" ──► /cursos/[slug] (ciência + escolha da turma)
                                          │
                     POST /api/checkout/create-preference ──► Mercado Pago
                     grava pending + ciência + IP + CPF cifrado    │
                                                                   ▼
/cursos/[slug]/confirmacao ◄── retorno ── POST /api/webhooks/mercadopago
                                          valida x-signature, consulta a API,
                                          aprova e envia e-mail com QR code
                                                                   │
              no dia: /admin/checkin/[token] (QR) ou /admin/checkin (lista)
                                                                   │
     /reembolso ─► link por e-mail ─► /reembolso/[token] ─► decisão automática
                                                  ou /admin/reembolsos (análise)
                                                                   │
     /admin/checkin → "Enviar certificado" ─► /certificado/[token] (PDF)
                                              /certificado/verificar/[id]
```

## Primeira configuração

1. **`npm run setup`**, num terminal interativo (PowerShell ou o terminal do
   VS Code). O script:
   - cria o `.env` a partir de `env.template`;
   - gera `APP_SECRET` e `DATA_ENCRYPTION_KEY` com 32 bytes aleatórios;
   - pede o usuário e a senha do **admin master** (a senha não aparece na tela
     e só o hash scrypt é gravado);
   - mostra um QR code para cadastrar o 2FA no app autenticador e só salva
     depois que você digita um código válido.
2. **Guarde a `DATA_ENCRYPTION_KEY` num cofre de senhas** (1Password,
   Bitwarden). Sem ela, os CPFs cifrados no banco ficam ilegíveis.
3. Preencha no `.env` o que é manual: `DATABASE_URL`, `MP_ACCESS_TOKEN`,
   `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
4. **`npm run db:migrate`** para criar as tabelas.
5. **`npm run dev`**, entre em `/admin/login` como master e:
   - em **Usuários**, crie os demais admins. Cada um recebe uma senha
     temporária, mostrada uma única vez, e no primeiro acesso é obrigado a
     trocá-la e a ativar o 2FA;
   - em **Cursos**, confira o "Impressão 3D: Basic" (a migração já o cadastra)
     ou crie um curso novo, como rascunho, e publique;
   - em **Turmas**, cadastre a turma como rascunho — com a **política de
     reembolso dela** —, confira e mude para "aberta". A página do curso passa
     a mostrar o formulário na hora.
6. **Mercado Pago**: em _Suas integrações → sua aplicação → Webhooks_,
   cadastre `https://tkxhi.com/api/webhooks/mercadopago` com o evento
   **Pagamentos** e copie a assinatura secreta para `MP_WEBHOOK_SECRET`.
7. **Texto de ciência**: revise `src/lib/consent.ts` com um advogado. Ao
   mudar a redação, troque `CONSENT_VERSION`.

## Produção (Vercel)

- Cadastre cada variável em _Settings → Environment Variables_ marcada como
  **Sensitive**: depois de salva, nem quem tem acesso ao projeto consegue
  lê-la de volta.
- Use **valores diferentes** para Production e Preview: gere um segundo
  conjunto com `npm run setup` numa cópia do projeto. Um vazamento no preview
  não compromete a produção.
- Em Preview, use `MP_ACCESS_TOKEN` de teste (`TEST-…`) e outro banco.
- No banco, crie um usuário só para o app, sem superusuário, e ative o SSL
  (`?sslmode=require` na URL, se o provedor não fizer isso por padrão).
- Ative 2FA nas contas da Vercel, do Mercado Pago, do Resend e do provedor do
  banco. As credenciais do app valem tanto quanto essas contas.

## Variáveis de ambiente

O modelo comentado está em [`env.template`](../env.template).

| Variável                       | Origem   | Para quê                                                                    |
| ------------------------------ | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`                 | manual   | Postgres. No Supabase, a string do pooler (porta 6543).                     |
| `MP_ACCESS_TOKEN`              | manual   | Access token da aplicação no Mercado Pago.                                  |
| `MP_WEBHOOK_SECRET`            | manual   | Assinatura secreta do webhook, gerada no painel do MP.                      |
| `APP_SECRET`                   | setup    | Assina os links de reembolso. Chaves por finalidade são derivadas por HKDF. |
| `APP_SECRET_PREVIOUS`          | setup    | Só durante uma rotação: continua aceito para verificar links antigos.       |
| `DATA_ENCRYPTION_KEY`          | setup    | AES-256-GCM dos CPFs e dos segredos 2FA no banco.                           |
| `DATA_ENCRYPTION_KEY_PREVIOUS` | manual   | Só durante uma recifragem: continua aceita para decifrar.                   |
| `ADMIN_MASTER_USERNAME`        | setup    | Usuário do master.                                                          |
| `ADMIN_MASTER_PASSWORD_HASH`   | setup    | Hash scrypt da senha do master (N=2^17, r=8, p=1).                          |
| `ADMIN_MASTER_TOTP_SECRET`     | setup    | Segredo do 2FA do master.                                                   |
| `RESEND_API_KEY`               | manual   | Obrigatória em produção. Fora dela, sem chave, e-mails vão para o console.  |
| `EMAIL_FROM`                   | manual   | Remetente num domínio verificado no Resend.                                 |
| `ADMIN_NOTIFY_EMAIL`           | opcional | Quem recebe avisos de reembolso em análise e de chargeback.                 |
| `APP_URL`                      | opcional | URL pública para links e QR. Na Vercel, deixe vazio.                        |

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_`, e todo código que as lê
importa `server-only`: o build quebra se alguém tentar levá-las ao navegador.
Ao subir, o servidor avisa no log quais estão faltando (só os nomes).

### Rotação de segredos

| Situação                              | Como fazer                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Trocar senha ou 2FA do master         | `npm run setup -- --master`. As sessões abertas do master caem sozinhas.                                   |
| `APP_SECRET` pode ter vazado          | `npm run setup -- --rotate-app-secret`. Depois de 72 h, apague `APP_SECRET_PREVIOUS`.                      |
| Admin saiu da equipe                  | _Usuários → Desativar_. A sessão dele cai na hora.                                                         |
| Admin perdeu o celular do 2FA         | _Usuários → Nova senha_. Ele refaz o primeiro acesso.                                                      |
| `DATA_ENCRYPTION_KEY` pode ter vazado | Exige recifrar CPFs e segredos 2FA com a chave nova, usando `DATA_ENCRYPTION_KEY_PREVIOUS`. Não há script. |
| Token do MP ou chave do Resend vazou  | Revogue no painel do serviço, gere outro e atualize na Vercel.                                             |

## Modelo de segurança

### Painel (`/admin`)

- **Login com senha + 2FA (TOTP)** para todos, inclusive o master. O código
  vale uma vez só (anti-replay) e é conferido depois da senha.
- **O master mora só no `.env`.** Ele é o único que cria, desativa e reseta
  admins. Os admins ficam no banco e podem gerenciar turmas, check-in e
  reembolsos, mas não outros admins.
- **Primeiro acesso obrigatório**: a senha temporária abre só a tela de troca
  de senha e ativação do 2FA, que expira em 15 minutos.
- **Força bruta**: 5 falhas no mesmo usuário travam o acesso por 15 minutos;
  30 tentativas do mesmo IP também. A mensagem de erro é sempre a mesma, e um
  usuário inexistente leva o mesmo tempo que um existente para responder.
- **Sessões no banco**: o cookie leva 32 bytes aleatórios e o banco guarda só
  o SHA-256. Elas expiram com 2 h de inatividade ou 12 h de idade. Logout,
  desativação e troca de senha derrubam a sessão na hora. Em produção, o
  cookie usa o prefixo `__Host-` (só HTTPS, sem domínio), `HttpOnly` e
  `SameSite=Lax`.
- **CSP com nonce** por requisição (`src/proxy.ts`): só roda script com o
  nonce da resposta.
- **Autorização em toda página e server action** (`requireAdmin`,
  `requireMaster`), não no layout. Server actions do Next também conferem a
  origem, o que barra CSRF.

### Dados

- **CPF cifrado** com AES-256-GCM. O contexto entra como dado associado, então
  o texto cifrado de um CPF não decifra se for copiado para outro campo. No
  painel aparece completo; no e-mail aos admins, mascarado.
- **Segredos 2FA dos admins** cifrados do mesmo jeito.
- **Senhas** com scrypt nos parâmetros mínimos da OWASP. Política do NIST:
  mínimo de 12 caracteres (14 para o master), sem regra de símbolo.
- **Auditoria somente inserção**: o banco recusa UPDATE, DELETE e TRUNCATE em
  `audit_log`.

### Público

- Cabeçalhos em todas as respostas: HSTS de 2 anos, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, sem `X-Powered-By`.
- Páginas com token na URL (reembolso, QR, certificado) usam
  `Referrer-Policy: no-referrer`.
- **Checkout**: aceita só JSON do próprio site (confere a origem), no máximo
  4 KB, 10 tentativas por IP a cada 10 minutos, e só redireciona para o
  domínio do Mercado Pago.
- **Pedido de link de reembolso**: 5 por IP a cada 15 minutos, 1 por
  matrícula a cada 5 minutos. A resposta é sempre a mesma, para não revelar se
  um e-mail tem matrícula.
- **Webhook**: valida `x-signature` e consulta o pagamento na API do MP.
  Nunca confia no conteúdo da notificação.

### O que isto não cobre

- A CSP do site público permite script inline: nonce exigiria renderizar cada
  visita, contra a prioridade de SEO e velocidade. As páginas públicas não têm
  login nem dados sensíveis na tela.
- Não há proteção contra DDoS além da que a Vercel oferece. Se o site virar
  alvo, ative o Firewall da Vercel (Attack Challenge Mode).
- A segurança do banco e das contas externas depende do provedor e do 2FA
  nessas contas.

## Cursos

- O curso guarda o conteúdo: nome, chamada, descrição, instrutores, módulos
  (com ícone), materiais, software, o que trazer e a foto de abertura (uma das
  fotos de `src/lib/photos.ts`).
- Cada curso pertence a uma **frente** e herda a cor e a textura dela. A
  página da frente mostra os cursos dela; sem curso, a seção não aparece.
- **Rascunho** não aparece no site; **publicado** entra no catálogo `/cursos`,
  na home e na página da frente; **arquivado** sai do catálogo e da busca, mas
  a página continua no ar para links antigos.
- O **endereço** (`/cursos/<endereço>`) é gerado do nome e **não muda** depois
  de criado: turmas, matrículas e certificados apontam para ele.
- Só rascunho sem turma pode ser apagado. Curso com turma aberta não pode ser
  despublicado antes de fechar as vendas.
- Campo vazio (materiais, software, o que trazer) não aparece na página.

## Turmas

- **Rascunho** não aparece no site; **aberta** vende; **fechada** para de
  vender e mantém os alunos; **cancelada** exige que não haja aluno pago.
- Vagas não podem ficar abaixo do número de pagos, e uma turma com matrículas
  não troca de curso.
- **Quem já comprou mantém o preço e a política de reembolso da compra.** A
  data da turma é a atual: se remarcar, o prazo de reembolso acompanha.
- **A política de reembolso é definida em cada turma** (porcentagem e
  antecedência para quem desiste depois dos 7 dias). O formulário de turma
  nova vem com esses campos vazios, para ser uma decisão consciente, e os
  números entram no texto que o aluno aceita.
- Remarcar a data ou trocar o local **não avisa os alunos** automaticamente.
- Horários são de Brasília (UTC−3, sem horário de verão).
- A página do curso é estática e é refeita quando uma turma muda ou uma vaga
  é vendida ou liberada.

## Regras de reembolso

A decisão está em `src/lib/refund-policy.ts`, uma função pura. O sistema só
decide sozinho quando a resposta é sim. Tudo que pode virar negativa vai para
pessoas.

| Situação                                         | Resultado                            |
| ------------------------------------------------ | ------------------------------------ |
| até 7 dias do pagamento, sem check-in            | reembolso integral, na hora          |
| até 7 dias, com check-in                         | análise manual, com aviso por e-mail |
| depois de 7 dias, sem check-in, com antecedência | reembolso parcial (% da turma)       |
| qualquer outro caso, ou turma com 0%             | análise manual                       |
| reembolso automático recusado pelo Mercado Pago  | análise manual, com o erro anexado   |

## Matrícula repetida

A chave é **e-mail + nome do aluno** (sem diferenciar maiúsculas, acentos e
espaços extras). Um responsável pode matricular dois filhos com o próprio
e-mail; o mesmo aluno não paga duas vezes por engano. Uma nova tentativa de
pagamento do mesmo aluno cancela as tentativas pendentes anteriores dele — só
dele, não dos irmãos.

## Privacidade

`/politica-de-privacidade` descreve o que o sistema de fato faz: dados
coletados, finalidades e bases legais, fornecedores (Mercado Pago, Resend,
Vercel, Supabase), retenção de até 5 anos após a turma e os direitos da LGPD.
O texto de ciência cita a política, e o formulário tem o link. Ao mudar
coleta, armazenamento ou fornecedor, atualize a página e a data dela.

A eliminação ao fim dos 5 anos e os pedidos de titulares (acesso, correção,
exclusão) ainda são **manuais**: não há rotina automática.

## Decisões que fogem do pedido original

- **`mp_order_id` virou `mp_preference_id` + `mp_payment_id`.** O Checkout Pro
  cria uma preferência antes do pagamento e um pagamento depois. O reembolso é
  feito sobre o pagamento (`POST /v1/payments/{id}/refunds`); o
  `/v1/orders/{id}/refund` é da API de Orders e não serve aqui.
- **`/reembolso` não mostra a matrícula na tela.** Manda um link assinado para
  o e-mail cadastrado.
- **Status `cancelled`** em `payment_status`, para pagamentos recusados ou
  preferências que falharam, o que libera a vaga.
- **Boleto e lotérica ficam de fora**: a vaga fica reservada por 30 minutos e
  esses meios compensam em dias.
- **Abrir o QR não marca presença**: exige login e um toque em "Confirmar
  presença".
- **Aviso de análise por WhatsApp** não foi feito (exige a API paga do
  WhatsApp Business). Os avisos vão por e-mail.
