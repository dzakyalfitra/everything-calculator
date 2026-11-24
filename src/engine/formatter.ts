export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'INR'
  | 'AUD'
  | 'CAD'
  | 'CHF';

export interface CurrencySymbolOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
  decimals: number;
}

export const GLOBAL_CURRENCIES: CurrencySymbolOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)', decimals: 2 },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', decimals: 2 },
  { code: 'GBP', symbol: '£', label: 'GBP (£)', decimals: 2 },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)', decimals: 0 },
  { code: 'INR', symbol: '₹', label: 'INR (₹)', decimals: 2 },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)', decimals: 2 },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)', decimals: 2 },
  { code: 'CHF', symbol: 'CHF ', label: 'CHF', decimals: 2 },
];

/**
 * Cleans IEEE-754 floating-point artifacts (e.g., 0.1 + 0.2 -> 0.3)
 * while preserving genuine scientific magnitudes.
 */
export function sanitizeFloat(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Object.is(value, -0) || value === 0) return 0;
  const cleaned = Number(value.toPrecision(12));
  return Object.is(cleaned, -0) || cleaned === 0 ? 0 : cleaned;
}

/**
 * Formats numbers with locale-aware grouping and scientific notation
 * for extreme magnitudes (>= 1e12 or 0 < |x| < 1e-6).
 */
export function formatNumber(
  value: number,
  options: {
    maxDecimals?: number;
    minDecimals?: number;
    useGrouping?: boolean;
    scientificThreshold?: boolean;
    locale?: string;
  } = {},
): string {
  if (!Number.isFinite(value)) return 'Error';
  const clean = sanitizeFloat(value);
  if (clean === 0) {
    if (options.minDecimals && options.minDecimals > 0) {
      return (0).toLocaleString(options.locale, {
        minimumFractionDigits: options.minDecimals,
        maximumFractionDigits: options.minDecimals,
      });
    }
    return '0';
  }

  const abs = Math.abs(clean);
  const useSci = options.scientificThreshold !== false;
  if (useSci && (abs >= 1e12 || abs < 1e-6)) {
    return clean.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const maxDecimals = options.maxDecimals ?? 8;
  const minDecimals = Math.min(options.minDecimals ?? 0, maxDecimals);

  return clean.toLocaleString(options.locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: options.useGrouping ?? true,
  });
}

/**
 * Formats a currency value with the chosen global symbol and sign placement.
 */
export function formatCurrency(
  value: number,
  symbol: string,
  decimals = 2,
  locale?: string,
): string {
  if (!Number.isFinite(value)) return 'Error';
  const clean = sanitizeFloat(value);
  const abs = Math.abs(clean);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = clean < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Parses a numeric input string cleanly, returning null for empty or invalid text.
 */
export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
    return null;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export function getCurrencyOption(code: CurrencyCode): CurrencySymbolOption {
  return (
    GLOBAL_CURRENCIES.find((c) => c.code === code) ?? GLOBAL_CURRENCIES[0]
  );
}
