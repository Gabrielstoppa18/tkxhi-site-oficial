/** Remove a máscara e devolve os 11 dígitos, ou null se o CPF for inválido. */
export function normalizeCpf(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return null;

  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  if (check(9) !== Number(digits[9]) || check(10) !== Number(digits[10])) {
    return null;
  }
  return digits;
}
