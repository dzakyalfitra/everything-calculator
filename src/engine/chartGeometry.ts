import type { AmortizationYear, CompoundYearPoint } from './finance.ts';
import { sanitizeFloat } from './formatter.ts';

export interface NiceAxis {
  maxTick: number;
  ticks: number[];
}

export interface CompoundChartPoint {
  year: number;
  contributions: number;
  interest: number;
  balance: number;
}

export interface LoanChartPoint {
  year: number;
  remainingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

export interface BoxPlotPositions {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  isDegenerate: boolean;
}

/**
 * Formats large or small numeric values compactly for chart axis labels.
 */
export function formatCompactNumber(value: number, prefix = ''): string {
  if (!Number.isFinite(value)) return '0';
  const clean = sanitizeFloat(value);
  if (clean === 0) return `${prefix}0`;

  const sign = clean < 0 ? '-' : '';
  const abs = Math.abs(clean);

  const units: { threshold: number; suffix: string }[] = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'k' },
  ];

  for (const u of units) {
    if (abs >= u.threshold) {
      const scaled = abs / u.threshold;
      const rounded =
        scaled >= 100
          ? Math.round(scaled).toString()
          : Number(scaled.toFixed(1)).toString();
      return `${sign}${prefix}${rounded}${u.suffix}`;
    }
  }

  if (abs < 1) {
    return `${sign}${prefix}${Number(abs.toFixed(2))}`;
  }
  return `${sign}${prefix}${Math.round(abs).toLocaleString()}`;
}

/**
 * Computes clean, human-readable axis ticks from 0 up to >= maxValue.
 */
export function computeNiceTicks(maxValue: number, segments = 4): NiceAxis {
  const safeSegments = Math.max(1, Math.round(segments));
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return {
      maxTick: 1,
      ticks: Array.from({ length: safeSegments + 1 }, (_, i) =>
        sanitizeFloat(i / safeSegments),
      ),
    };
  }

  const rawStep = maxValue / safeSegments;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / magnitude;

  let niceFraction: number;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  const step = sanitizeFloat(niceFraction * magnitude);
  const maxTick = sanitizeFloat(step * safeSegments);
  const ticks = Array.from({ length: safeSegments + 1 }, (_, i) =>
    sanitizeFloat(i * step),
  );

  return { maxTick, ticks };
}

/**
 * Prepends Year 0 to compound growth output for continuous chart plotting.
 */
export function buildCompoundSeries(
  initialPrincipal: number,
  yearlyGrowth: CompoundYearPoint[],
): CompoundChartPoint[] {
  const startPrincipal = Math.max(0, sanitizeFloat(initialPrincipal));
  const series: CompoundChartPoint[] = [
    {
      year: 0,
      contributions: startPrincipal,
      interest: 0,
      balance: startPrincipal,
    },
  ];

  for (const pt of yearlyGrowth) {
    series.push({
      year: pt.year,
      contributions: pt.contributions,
      interest: pt.interest,
      balance: pt.balance,
    });
  }

  return series;
}

/**
 * Prepends Year 0 and accumulates cumulative principal & interest for loan charting.
 */
export function buildLoanSeries(
  principal: number,
  yearlySchedule: AmortizationYear[],
): LoanChartPoint[] {
  const startPrincipal = Math.max(0, sanitizeFloat(principal));
  const series: LoanChartPoint[] = [
    {
      year: 0,
      remainingBalance: startPrincipal,
      cumulativePrincipal: 0,
      cumulativeInterest: 0,
    },
  ];

  let cumPrincipal = 0;
  let cumInterest = 0;
  for (const row of yearlySchedule) {
    cumPrincipal = sanitizeFloat(cumPrincipal + row.principalPaid);
    cumInterest = sanitizeFloat(cumInterest + row.interestPaid);
    series.push({
      year: row.year,
      remainingBalance: row.endingBalance,
      cumulativePrincipal: cumPrincipal,
      cumulativeInterest: cumInterest,
    });
  }

  return series;
}

/**
 * Normalizes summary statistics onto [0, 1] for horizontal box-and-whisker plotting.
 */
export function computeBoxPlotPositions(stats: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}): BoxPlotPositions {
  const span = stats.max - stats.min;
  if (!Number.isFinite(span) || span <= 0) {
    return {
      min: 0.5,
      q1: 0.5,
      median: 0.5,
      q3: 0.5,
      max: 0.5,
      mean: 0.5,
      isDegenerate: true,
    };
  }

  const norm = (v: number) =>
    Math.min(1, Math.max(0, sanitizeFloat((v - stats.min) / span)));

  return {
    min: 0,
    q1: norm(stats.q1),
    median: norm(stats.median),
    q3: norm(stats.q3),
    max: 1,
    mean: norm(stats.mean),
    isDegenerate: false,
  };
}

/**
 * Maps a BMI value to a 0..100 percentage aligned with the 4 equal-width WHO band segments:
 * [0..25%: <18.5], [25..50%: 18.5-25), [50..75%: 25-30), [75..100%: >=30].
 */
export function computeBmiGaugePercent(bmi: number): number {
  if (!Number.isFinite(bmi)) return 0;

  const stops = [
    { bmi: 12, pct: 0 },
    { bmi: 18.5, pct: 25 },
    { bmi: 25, pct: 50 },
    { bmi: 30, pct: 75 },
    { bmi: 42, pct: 100 },
  ];

  if (bmi <= stops[0].bmi) return 0;
  if (bmi >= stops[stops.length - 1].bmi) return 100;

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (bmi <= b.bmi) {
      const ratio = (bmi - a.bmi) / (b.bmi - a.bmi);
      return sanitizeFloat(a.pct + ratio * (b.pct - a.pct));
    }
  }
  return 100;
}
