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
  const min = options?.minimumFractionDigits ?? (isWhole ? 0 : 2);
  const max = Math.max(min, options?.maximumFractionDigits ?? (isWhole ? 0 : 2));

  return value.toLocaleString("en-GB", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

export function formatMoney(value: number, options?: MoneyFormatOptions): string {
  return `${CURRENCY_SYMBOL}${formatNumberUK(value, options)}`;
}

/** Compact format for large numbers: 3200 → "3.2K", 1800 → "1.8K" */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 1000) {
    return String(Math.round(value));
  }
  const k = value / 1000;
  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
}

/** Brazilian locale format (3.240,50) - period for thousands, comma for decimals */
export function formatBRLocale(value: number, options?: MoneyFormatOptions): string {
  const isWhole = Number.isFinite(value) && Math.abs(value % 1) < 1e-9;
  const min = options?.minimumFractionDigits ?? (isWhole ? 0 : 2);
  const max = Math.max(min, options?.maximumFractionDigits ?? (isWhole ? 0 : 2));

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

