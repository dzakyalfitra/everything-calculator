import { sanitizeFloat } from './formatter.ts';

export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
  /** Reference units per 1 USD */
  ratePerUsd: number;
  decimals: number;
}

export const REFERENCE_RATES_NOTE = 'Reference rates (editable for live bank rates)';

export const CURRENCY_LIST: CurrencyEntry[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', ratePerUsd: 1.0, decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', ratePerUsd: 0.92, decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', ratePerUsd: 0.79, decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', ratePerUsd: 153.5, decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', ratePerUsd: 7.24, decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', ratePerUsd: 84.4, decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', ratePerUsd: 1.39, decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', ratePerUsd: 1.53, decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', ratePerUsd: 0.88, decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', ratePerUsd: 1395.0, decimals: 0 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', ratePerUsd: 1.34, decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', ratePerUsd: 7.78, decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', ratePerUsd: 20.1, decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', ratePerUsd: 5.75, decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', ratePerUsd: 1.68, decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr ', ratePerUsd: 10.85, decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr ', ratePerUsd: 11.05, decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr ', ratePerUsd: 6.86, decimals: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', ratePerUsd: 4.02, decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', ratePerUsd: 34.4, decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ', ratePerUsd: 15850, decimals: 0 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', ratePerUsd: 3.6725, decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', ratePerUsd: 3.75, decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R ', ratePerUsd: 18.05, decimals: 2 },
];

export interface CurrencyConversionResult {
  ok: true;
  convertedAmount: number;
  effectiveRate: number;
  inverseRate: number;
  isCustomRate: boolean;
  fromCurrency: CurrencyEntry;
  toCurrency: CurrencyEntry;
  formula: string;
}

export interface CurrencyConversionError {
  ok: false;
  error: string;
}

export function getReferenceExchangeRate(fromCode: string, toCode: string): number {
  const from = CURRENCY_LIST.find((c) => c.code === fromCode);
  const to = CURRENCY_LIST.find((c) => c.code === toCode);
  if (!from || !to) return 1;
  return sanitizeFloat(to.ratePerUsd / from.ratePerUsd);
}

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  customRate?: number | null,
): CurrencyConversionResult | CurrencyConversionError {
  const from = CURRENCY_LIST.find((c) => c.code === fromCode);
  const to = CURRENCY_LIST.find((c) => c.code === toCode);
  if (!from || !to) {
    return { ok: false, error: 'Unsupported currency selected.' };
  }
  if (amount < 0) {
    return { ok: false, error: 'Amount cannot be negative.' };
  }

  let effectiveRate = getReferenceExchangeRate(fromCode, toCode);
  let isCustomRate = false;

  if (customRate !== undefined && customRate !== null) {
    if (!Number.isFinite(customRate) || customRate <= 0) {
      return { ok: false, error: 'Custom exchange rate must be greater than 0.' };
    }
    effectiveRate = customRate;
    isCustomRate = true;
  }

  const convertedAmount = sanitizeFloat(amount * effectiveRate);
  const inverseRate = sanitizeFloat(1 / effectiveRate);

  return {
    ok: true,
    convertedAmount,
    effectiveRate: sanitizeFloat(effectiveRate),
    inverseRate,
    isCustomRate,
    fromCurrency: from,
    toCurrency: to,
    formula: `1 ${from.code} = ${sanitizeFloat(effectiveRate)} ${to.code} (1 ${to.code} = ${inverseRate} ${from.code})`,
  };
}
