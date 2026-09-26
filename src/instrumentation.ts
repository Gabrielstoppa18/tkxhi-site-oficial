/**
 * Roda uma vez quando o servidor sobe. Avisa no log quais variáveis de
 * ambiente faltam — só os nomes, nunca os valores. Não derruba o servidor: o
 * site institucional continua no ar mesmo sem o fluxo de cursos configurado.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { missingEnv } = await import("@/lib/server/env");
  const missing = missingEnv();
  if (missing.length > 0) {
    console.warn(
      `[tkxhi] Variáveis de ambiente ausentes: ${missing.join(", ")}. Cursos e painel ficam indisponíveis até configurar (npm run setup).`,
    );
  }
}
