/**
 * Formatação para o público brasileiro. O fuso é fixo em São Paulo: o servidor
 * da Vercel roda em UTC, e "sábado às 8h" precisa sair igual no e-mail, na
 * página e no certificado.
 */
const TIME_ZONE = "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCpf(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/** Data (AAAA-MM-DD) e hora (HH:MM) em Brasília, para preencher inputs de data e hora. */
export function brasiliaInputParts(value: string | Date): {
  date: string;
  time: string;
} {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
