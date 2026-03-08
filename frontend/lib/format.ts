/** Brazilian Real (BRL) - used across the app */
export const CURRENCY_SYMBOL = "R$";

export function formatBRL(value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
}

export function formatMoney(value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  return `${CURRENCY_SYMBOL} ${formatBRL(value, options)}`;
}
