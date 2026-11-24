import { sanitizeFloat } from './formatter.ts';

export interface PercentOfResult {
  value: number;
  formula: string;
}

export interface PercentChangeResult {
  ok: true;
  delta: number;
  percentChange: number;
  direction: 'increase' | 'decrease' | 'unchanged';
  formula: string;
}

export interface PercentChangeError {
  ok: false;
  error: string;
}

export interface DiscountTaxResult {
  originalPrice: number;
  discountPercent: number;
  taxPercent: number;
  discountSavings: number;
  priceAfterDiscount: number;
  taxAmount: number;
  finalPrice: number;
  warnings: string[];
  formula: string;
}

export function calculatePercentOf(
  percent: number,
  base: number,
): PercentOfResult {
  const value = sanitizeFloat((percent / 100) * base);
  return {
    value,
    formula: `${percent}% × ${base} = (${percent} / 100) × ${base} = ${value}`,
  };
}

export function calculatePercentChange(
  fromValue: number,
  toValue: number,
): PercentChangeResult | PercentChangeError {
  if (fromValue === 0) {
    return {
      ok: false,
      error: 'Undefined percentage change from 0 (division by zero)',
    };
  }
  const delta = sanitizeFloat(toValue - fromValue);
  const pct = sanitizeFloat((delta / Math.abs(fromValue)) * 100);
  const direction =
    delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged';
  return {
    ok: true,
    delta,
    percentChange: pct,
    direction,
    formula: `((${toValue} - ${fromValue}) / |${fromValue}|) × 100 = ${pct}%`,
  };
}

export function calculateDiscountAndTax(
  originalPrice: number,
  discountPercent: number,
  taxPercent: number,
): DiscountTaxResult {
  const warnings: string[] = [];
  let safePrice = originalPrice;
  if (safePrice < 0) {
    warnings.push('Price cannot be negative; clamped to 0.');
    safePrice = 0;
  }

  let safeDiscount = discountPercent;
  if (safeDiscount < 0) {
    warnings.push('Discount cannot be negative; clamped to 0%.');
    safeDiscount = 0;
  } else if (safeDiscount > 100) {
    warnings.push('Discount exceeds 100%; clamped to 100%.');
    safeDiscount = 100;
  }

  let safeTax = taxPercent;
  if (safeTax < 0) {
    warnings.push('Tax/VAT rate cannot be negative; clamped to 0%.');
    safeTax = 0;
  }

  const discountSavings = sanitizeFloat(safePrice * (safeDiscount / 100));
  const priceAfterDiscount = sanitizeFloat(safePrice - discountSavings);
  const taxAmount = sanitizeFloat(priceAfterDiscount * (safeTax / 100));
  const finalPrice = sanitizeFloat(priceAfterDiscount + taxAmount);

  return {
    originalPrice: safePrice,
    discountPercent: safeDiscount,
    taxPercent: safeTax,
    discountSavings,
    priceAfterDiscount,
    taxAmount,
    finalPrice,
    warnings,
    formula: `Final = (${safePrice} × (1 - ${safeDiscount}/100)) × (1 + ${safeTax}/100)`,
  };
}
