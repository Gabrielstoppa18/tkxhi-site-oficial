/**
 * Ambientes de teste não podem ser indexados: um clone do site no Google
 * concorre com o domínio oficial e vira conteúdo duplicado.
 *
 * O padrão é bloquear. Para liberar, defina NEXT_PUBLIC_ALLOW_INDEXING=true
 * nas variáveis de ambiente — só no deploy que atende o domínio definitivo.
 */
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
