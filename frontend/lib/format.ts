/** Brazilian Real (BRL) - used across the app */
export const CURRENCY_SYMBOL = "R$";

type MoneyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Format a numeric value like UK/US style (10,000.00) but with the BRL symbol.
 */
export function formatNumberUK(value: number, options?: MoneyFormatOptions): string {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
}

export function formatMoney(value: number, options?: MoneyFormatOptions): string {
  return `${CURRENCY_SYMBOL} ${formatNumberUK(value, options)}`;
}

