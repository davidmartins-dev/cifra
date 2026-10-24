/**
 * Utilitários centralizados de formatação e máscaras para o front-end.
 */

/**
 * Remove todos os caracteres não numéricos de uma string.
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara de moeda brasileira (BRL) - R$ 0,00.
 * Suporta números, strings puras de dígitos ou valores já pré-formatados.
 */
export function maskCurrencyBRL(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "R$ 0,00";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "R$ 0,00";

  const numericValue = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

/**
 * Converte valor mascarado ou string numérica para número decimal (ex.: "R$ 1.500,50" -> 1500.5).
 */
export function parseCurrencyBRL(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  const cleanDigits = value.replace(/\D/g, "");
  if (!cleanDigits) return 0;

  return Number(cleanDigits) / 100;
}

/**
 * Aplica máscara de CPF (000.000.000-00).
 */
export function maskCPF(value: string): string {
  const digits = unmask(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00).
 */
export function maskCNPJ(value: string): string {
  const digits = unmask(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Aplica máscara de Telefone fixo ou celular ((00) 0000-0000 ou (00) 00000-0000).
 */
export function maskPhone(value: string): string {
  const digits = unmask(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Aplica máscara de CEP (00000-000).
 */
export function maskCEP(value: string): string {
  const digits = unmask(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

/**
 * Aplica máscara de Data (DD/MM/AAAA).
 */
export function maskDate(value: string): string {
  const digits = unmask(value).slice(0, 8);
  return digits
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}
