import { sanitizeFloat } from './formatter.ts';

export interface LoanInput {
  principal: number;
  annualRatePercent: number;
  termValue: number;
  termUnit: 'years' | 'months';
}

export interface AmortizationYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface LoanResult {
  ok: true;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  principalPercent: number;
  interestPercent: number;
  yearlySchedule: AmortizationYear[];
  formula: string;
}

export interface FinanceError {
  ok: false;
  error: string;
}

export type CompoundingFrequency =
  | 'daily'
  | 'monthly'
  | 'quarterly'
  | 'semiannually'
  | 'annually';

export const COMPOUNDING_PERIODS: Record<CompoundingFrequency, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1,
};

export interface CompoundInput {
  initialPrincipal: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  compounding: CompoundingFrequency;
}

export interface CompoundYearPoint {
  year: number;
  contributions: number;
  interest: number;
  balance: number;
}

export interface CompoundResult {
  ok: true;
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  effectiveAnnualRate: number;
  yearlyGrowth: CompoundYearPoint[];
  formula: string;
}

export interface SimpleInterestInput {
  principal: number;
  annualRatePercent: number;
  timeValue: number;
  timeUnit: 'years' | 'months' | 'days';
}

export interface SimpleInterestResult {
  ok: true;
  interest: number;
  totalAmount: number;
  yearsEquivalent: number;
  formula: string;
}

export function calculateLoan(input: LoanInput): LoanResult | FinanceError {
  if (input.principal <= 0) {
    return { ok: false, error: 'Loan principal must be greater than 0.' };
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, error: 'Annual interest rate cannot be negative.' };
  }
  const totalMonths = Math.round(
    input.termUnit === 'years' ? input.termValue * 12 : input.termValue,
  );
  if (totalMonths < 1 || totalMonths > 1200) {
    return { ok: false, error: 'Loan term must be between 1 month and 100 years.' };
  }

  const r = input.annualRatePercent / 100 / 12;
  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = input.principal / totalMonths;
  } else {
    const factor = Math.pow(1 + r, totalMonths);
    monthlyPayment = (input.principal * (r * factor)) / (factor - 1);
  }

  let balance = input.principal;
  let totalInterestAcc = 0;
  let totalPaidAcc = 0;
  const yearlySchedule: AmortizationYear[] = [];

  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = balance * r;
    const principalPart =
      m === totalMonths ? balance : Math.min(balance, monthlyPayment - interest);
    const actualPayment = principalPart + interest;
    balance = Math.max(0, balance - principalPart);

    yearPrincipal += principalPart;
    yearInterest += interest;
    totalInterestAcc += interest;
    totalPaidAcc += actualPayment;

    if (m % 12 === 0 || m === totalMonths) {
      yearlySchedule.push({
        year: Math.ceil(m / 12),
        principalPaid: sanitizeFloat(yearPrincipal),
        interestPaid: sanitizeFloat(yearInterest),
        endingBalance: sanitizeFloat(balance),
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  const totalPayment = sanitizeFloat(totalPaidAcc);
  const totalInterest = sanitizeFloat(totalInterestAcc);
  const principalPercent = sanitizeFloat((input.principal / totalPayment) * 100);
  const interestPercent = sanitizeFloat(100 - principalPercent);

  const formula =
    r === 0
      ? `M = P / n = ${input.principal} / ${totalMonths}`
      : `M = P · [r(1+r)^n] / [(1+r)^n − 1], r = ${(r * 100).toFixed(4)}%/mo, n = ${totalMonths}`;

  return {
    ok: true,
    monthlyPayment: sanitizeFloat(monthlyPayment),
    totalPayment,
    totalInterest,
    totalMonths,
    principalPercent,
    interestPercent,
    yearlySchedule,
    formula,
  };
}

export function calculateCompoundInterest(
  input: CompoundInput,
): CompoundResult | FinanceError {
  if (input.initialPrincipal < 0 || input.monthlyContribution < 0) {
    return { ok: false, error: 'Principal and contributions cannot be negative.' };
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, error: 'Annual interest rate cannot be negative.' };
  }
  if (input.years < 0 || input.years > 100) {
    return { ok: false, error: 'Investment duration must be between 0 and 100 years.' };
  }

  const n = COMPOUNDING_PERIODS[input.compounding];
  const r = input.annualRatePercent / 100;
  // Monthly effective rate equivalent to nominal annual rate compounded n times/year
  const effectiveAnnualRate =
    r === 0 ? 0 : sanitizeFloat((Math.pow(1 + r / n, n) - 1) * 100);
  const monthlyRate = r === 0 ? 0 : Math.pow(1 + r / n, n / 12) - 1;

  const totalMonths = Math.round(input.years * 12);
  let balance = input.initialPrincipal;
  let totalContributions = input.initialPrincipal;
  const yearlyGrowth: CompoundYearPoint[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + input.monthlyContribution;
    totalContributions += input.monthlyContribution;

    if (m % 12 === 0 || m === totalMonths) {
      const yr = Math.ceil(m / 12);
      yearlyGrowth.push({
        year: yr,
        contributions: sanitizeFloat(totalContributions),
        interest: sanitizeFloat(Math.max(0, balance - totalContributions)),
        balance: sanitizeFloat(balance),
      });
    }
  }

  const futureValue = sanitizeFloat(balance);
  const cleanContrib = sanitizeFloat(totalContributions);
  const totalInterest = sanitizeFloat(Math.max(0, futureValue - cleanContrib));

  return {
    ok: true,
    futureValue,
    totalContributions: cleanContrib,
    totalInterest,
    effectiveAnnualRate,
    yearlyGrowth,
    formula: `APY = (1 + r/${n})^${n} − 1 = ${effectiveAnnualRate}%`,
  };
}

export function calculateSimpleInterest(
  input: SimpleInterestInput,
): SimpleInterestResult | FinanceError {
  if (input.principal < 0) {
    return { ok: false, error: 'Principal cannot be negative.' };
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, error: 'Interest rate cannot be negative.' };
  }
  if (input.timeValue < 0) {
    return { ok: false, error: 'Time duration cannot be negative.' };
  }

  let yearsEquivalent = input.timeValue;
  if (input.timeUnit === 'months') {
    yearsEquivalent = input.timeValue / 12;
  } else if (input.timeUnit === 'days') {
    yearsEquivalent = input.timeValue / 365;
  }

  const r = input.annualRatePercent / 100;
  const interest = sanitizeFloat(input.principal * r * yearsEquivalent);
  const totalAmount = sanitizeFloat(input.principal + interest);

  return {
    ok: true,
    interest,
    totalAmount,
    yearsEquivalent: sanitizeFloat(yearsEquivalent),
    formula: `I = P · r · t = ${input.principal} × ${input.annualRatePercent}% × ${sanitizeFloat(yearsEquivalent)} yr`,
  };
}
