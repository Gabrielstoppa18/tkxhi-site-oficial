/**
 * Telefone brasileiro (celular ou fixo). Guardado em E.164 (+55DDNNNNNNNNN),
 * cifrado no banco; exibido como (DD) NNNNN-NNNN.
 */

/** Só dígitos do número nacional (DDD + número), sem o 55. */
function nationalDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  // Zero de operadora só com 12 dígitos (0 + DDD + celular): com menos, um
  // DDD inválido como "01" viraria outro número válido.
  if (digits.length === 12 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/**
 * Valida e normaliza. Aceita "(64) 99999-9999", "64999999999", "+55 64…".
 * Devolve "+5564999999999" ou null se não for um telefone brasileiro válido.
 */
export function normalizePhone(input: string): string | null {
  const digits = nationalDigits(input);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || digits[2] === "0") return null;
  // Celular tem 11 dígitos e começa com 9 depois do DDD.
  if (digits.length === 11 && digits[2] !== "9") return null;
  return `+55${digits}`;
}

/** "+5564999999999" → "(64) 99999-9999". */
export function formatPhone(e164: string): string {
  const digits = nationalDigits(e164);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

/** Máscara enquanto a pessoa digita, para o formulário. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Link para abrir conversa no WhatsApp com o número. */
export function whatsappLink(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}
