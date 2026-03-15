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
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.00";

  const isWhole = Math.abs(num % 1) < 1e-9;
  let min = options?.minimumFractionDigits;
  if (min === undefined) min = isWhole ? 0 : 2;
  
  let max = options?.maximumFractionDigits;
  if (max === undefined) max = Math.max(min, isWhole ? 0 : 2);
  
  // Final safety checks for toLocaleString
  if (max < min) max = min;
  const safeMin = Math.floor(Math.max(0, Math.min(20, min)));
  const safeMax = Math.floor(Math.max(safeMin, Math.min(20, max)));

  return num.toLocaleString("en-GB", {
    minimumFractionDigits: safeMin,
    maximumFractionDigits: safeMax,
  });
}

export function formatMoney(value: number, options?: MoneyFormatOptions): string {
  return `${CURRENCY_SYMBOL} ${formatNumberUK(value, options)}`;
}

/** Compact format for large numbers: 3200 → "3.2K", 1800 → "1.8K" */
export function formatCompact(value: number): string {
  const num = Number(value);
  if (!Number.isFinite(num) || Math.abs(num) < 1000) {
    return String(Math.round(num || 0));
  }
  const k = num / 1000;
  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
}

/** Brazilian locale format (3.240,50) - period for thousands, comma for decimals */
export function formatBRLocale(value: number, options?: MoneyFormatOptions): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0,00";

  const isWhole = Math.abs(num % 1) < 1e-9;
  let min = options?.minimumFractionDigits;
  if (min === undefined) min = isWhole ? 0 : 2;
  
  let max = options?.maximumFractionDigits;
  if (max === undefined) max = Math.max(min, isWhole ? 0 : 2);
  
  // Final safety checks for toLocaleString
  if (max < min) max = min;
  const safeMin = Math.floor(Math.max(0, Math.min(20, min)));
  const safeMax = Math.floor(Math.max(safeMin, Math.min(20, max)));

  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: safeMin,
    maximumFractionDigits: safeMax,
  });
}
