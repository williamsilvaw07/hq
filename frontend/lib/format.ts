/** Brazilian Real (BRL) - used across the app */
export const CURRENCY_SYMBOL = "R$";

type MoneyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Legacy name kept for backwards compatibility.
 * Formats number using UK-style separators (10,000.00).
 */
export function formatBRL(value: number, options?: MoneyFormatOptions): string {
  return formatNumberUK(value, options);
}

/**
 * Format a numeric value like UK/US style (10,000.00) but with the BRL symbol.
 */
export function formatNumberUK(value: number, options?: MoneyFormatOptions): string {
  const isWhole = Number.isFinite(value) && Math.abs(value % 1) < 1e-9;
  const minimumFractionDigits =
    options?.minimumFractionDigits ?? (isWhole ? 0 : 2);
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (isWhole ? 0 : 2);

  return value.toLocaleString("en-GB", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

export function formatMoney(value: number, options?: MoneyFormatOptions): string {
  return `${CURRENCY_SYMBOL}${formatNumberUK(value, options)}`;
}

