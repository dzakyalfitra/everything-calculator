import { sanitizeFloat } from './formatter.ts';

export interface TipSplitInput {
  billAmount: number;
  taxAmount: number;
  tipPercent: number;
  partySize: number;
  tipOnPreTax: boolean;
  roundUpPerPerson: boolean;
}

export interface TipSplitResult {
  tipBase: number;
  tipAmount: number;
  totalBill: number;
  perPerson: number;
  tipPerPerson: number;
  partySize: number;
  roundingNote: string | null;
  warnings: string[];
  formula: string;
}

export function calculateTipSplit(input: TipSplitInput): TipSplitResult {
  const warnings: string[] = [];
  let bill = input.billAmount;
  if (bill < 0) {
    warnings.push('Bill amount cannot be negative; clamped to 0.');
    bill = 0;
  }

  let tax = input.taxAmount;
  if (tax < 0) {
    warnings.push('Tax amount cannot be negative; clamped to 0.');
    tax = 0;
  }
  if (input.tipOnPreTax && tax > bill) {
    warnings.push('Tax exceeds bill total; pre-tax base clamped to 0.');
    tax = bill;
  }

  let tipPct = input.tipPercent;
  if (tipPct < 0) {
    warnings.push('Tip percentage cannot be negative; clamped to 0%.');
    tipPct = 0;
  }

  let partySize = Math.floor(input.partySize);
  if (!Number.isFinite(partySize) || partySize < 1) {
    warnings.push('Party size must be at least 1.');
    partySize = 1;
  } else if (!Number.isInteger(input.partySize)) {
    warnings.push('Party size rounded down to whole people.');
  }

  const tipBase = sanitizeFloat(input.tipOnPreTax ? Math.max(0, bill - tax) : bill);
  const tipAmount = sanitizeFloat(tipBase * (tipPct / 100));
  const rawTotalBill = sanitizeFloat(bill + tipAmount);
  const rawPerPerson = rawTotalBill / partySize;

  let perPerson = sanitizeFloat(rawPerPerson);
  let totalBill = rawTotalBill;
  let roundingNote: string | null = null;

  if (input.roundUpPerPerson) {
    perPerson = Math.ceil(rawPerPerson);
    totalBill = sanitizeFloat(perPerson * partySize);
    const diff = sanitizeFloat(totalBill - rawTotalBill);
    if (diff > 0) {
      roundingNote = `Rounded up to whole currency unit (+${diff.toFixed(2)} total).`;
    }
  } else if (partySize > 1) {
    const roundedCents = Math.round(rawPerPerson * 100) / 100;
    const reconstructed = Math.round(roundedCents * partySize * 100) / 100;
    const centDiff = Math.round((rawTotalBill - reconstructed) * 100) / 100;
    if (Math.abs(centDiff) >= 0.01) {
      roundingNote = `Exact split has a ${Math.abs(centDiff).toFixed(2)} penny-rounding difference across ${partySize} people.`;
    }
  }

  const tipPerPerson = sanitizeFloat(tipAmount / partySize);

  return {
    tipBase,
    tipAmount,
    totalBill,
    perPerson,
    tipPerPerson,
    partySize,
    roundingNote,
    warnings,
    formula: `Tip = ${tipBase} × ${tipPct}% = ${tipAmount}; Per Person = ${totalBill} / ${partySize}`,
  };
}
