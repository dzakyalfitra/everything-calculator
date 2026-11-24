import { useCallback, useState } from 'react';
import type { AngleUnit } from '../engine/expressionParser.ts';
import type { UnitCategoryId } from '../engine/unitConverter.ts';
import type { CompoundingFrequency } from '../engine/finance.ts';
import type { ActivityLevelId, Sex } from '../engine/health.ts';

export interface StandardSession {
  expression: string;
  displayResult: string;
  error: string | null;
  memory: number;
  hasMemory: boolean;
  scientificOpen: boolean;
  angleUnit: AngleUnit;
  justEvaluated: boolean;
}

export interface PercentageSession {
  tab: 'percentOf' | 'change' | 'discount';
  pctX: string;
  pctY: string;
  changeFrom: string;
  changeTo: string;
  origPrice: string;
  discountPct: string;
  taxPct: string;
}

export interface TipSession {
  bill: string;
  tax: string;
  tipPct: string;
  partySize: string;
  tipOnPreTax: boolean;
  roundUp: boolean;
}

export interface UnitSession {
  category: UnitCategoryId;
  value: string;
  fromUnit: string;
  toUnit: string;
}

export interface DateSession {
  tab: 'diff' | 'offset';
  startDate: string;
  endDate: string;
  baseDate: string;
  direction: 'add' | 'subtract';
  years: string;
  months: string;
  weeks: string;
  days: string;
}

export interface FinanceSession {
  tab: 'loan' | 'compound' | 'simple';
  loanPrincipal: string;
  loanRate: string;
  loanTerm: string;
  loanTermUnit: 'years' | 'months';
  compPrincipal: string;
  compMonthly: string;
  compRate: string;
  compYears: string;
  compFreq: CompoundingFrequency;
  simpPrincipal: string;
  simpRate: string;
  simpTime: string;
  simpTimeUnit: 'years' | 'months' | 'days';
}

export interface CurrencySession {
  amount: string;
  fromCode: string;
  toCode: string;
  customRate: string;
}

export interface HealthSession {
  tab: 'bmi' | 'calories';
  weightKg: string;
  heightCm: string;
  weightLb: string;
  heightFt: string;
  heightIn: string;
  age: string;
  sex: Sex;
  activity: ActivityLevelId;
}

export interface StatisticsSession {
  rawInput: string;
}

export interface AllCalculatorSessions {
  standard: StandardSession;
  percentage: PercentageSession;
  tip: TipSession;
  unit: UnitSession;
  date: DateSession;
  finance: FinanceSession;
  currency: CurrencySession;
  health: HealthSession;
  statistics: StatisticsSession;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultSessions(): AllCalculatorSessions {
  const today = getTodayIso();
  return {
    standard: {
      expression: '',
      displayResult: '0',
      error: null,
      memory: 0,
      hasMemory: false,
      scientificOpen: false,
      angleUnit: 'deg',
      justEvaluated: false,
    },
    percentage: {
      tab: 'percentOf',
      pctX: '15',
      pctY: '240',
      changeFrom: '80',
      changeTo: '100',
      origPrice: '120',
      discountPct: '25',
      taxPct: '8',
    },
    tip: {
      bill: '86.40',
      tax: '6.40',
      tipPct: '18',
      partySize: '4',
      tipOnPreTax: false,
      roundUp: false,
    },
    unit: {
      category: 'length',
      value: '10',
      fromUnit: 'km',
      toUnit: 'mi',
    },
    date: {
      tab: 'diff',
      startDate: '2000-01-01',
      endDate: today,
      baseDate: today,
      direction: 'add',
      years: '0',
      months: '3',
      weeks: '0',
      days: '14',
    },
    finance: {
      tab: 'loan',
      loanPrincipal: '300000',
      loanRate: '5.0',
      loanTerm: '30',
      loanTermUnit: 'years',
      compPrincipal: '10000',
      compMonthly: '300',
      compRate: '7.0',
      compYears: '15',
      compFreq: 'monthly',
      simpPrincipal: '5000',
      simpRate: '4.5',
      simpTime: '2',
      simpTimeUnit: 'years',
    },
    currency: {
      amount: '100',
      fromCode: 'USD',
      toCode: 'EUR',
      customRate: '',
    },
    health: {
      tab: 'bmi',
      weightKg: '70',
      heightCm: '175',
      weightLb: '154.3',
      heightFt: '5',
      heightIn: '9',
      age: '30',
      sex: 'male',
      activity: 'moderate',
    },
    statistics: {
      rawInput: '14, 18, 21, 21, 24, 29, 32, 35, 41',
    },
  };
}

export function useSessionCache() {
  const [sessions, setSessions] = useState<AllCalculatorSessions>(
    getDefaultSessions,
  );

  const updateSession = useCallback(
    <K extends keyof AllCalculatorSessions>(
      key: K,
      updater:
        | Partial<AllCalculatorSessions[K]>
        | ((prev: AllCalculatorSessions[K]) => AllCalculatorSessions[K]),
    ) => {
      setSessions((prev) => {
        const current = prev[key];
        const next =
          typeof updater === 'function'
            ? updater(current)
            : { ...current, ...updater };
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const resetSession = useCallback(
    <K extends keyof AllCalculatorSessions>(key: K) => {
      const defaults = getDefaultSessions();
      setSessions((prev) => ({ ...prev, [key]: defaults[key] }));
    },
    [],
  );

  return { sessions, updateSession, resetSession };
}
