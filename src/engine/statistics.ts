import { sanitizeFloat } from './formatter.ts';

export interface DistributionBin {
  label: string;
  count: number;
  percentage: number;
}

export interface StatisticsResult {
  ok: true;
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  modeLabel: string;
  min: number;
  max: number;
  range: number;
  populationVariance: number;
  sampleVariance: number | null;
  populationStdDev: number;
  sampleStdDev: number | null;
  q1: number;
  q3: number;
  iqr: number;
  sortedValues: number[];
  invalidTokens: string[];
  bins: DistributionBin[];
}

export interface StatisticsError {
  ok: false;
  error: string;
  invalidTokens: string[];
}

function medianOfSorted(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildHistogram(sorted: number[]): DistributionBin[] {
  if (sorted.length === 0) return [];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) {
    return [{ label: `${min}`, count: sorted.length, percentage: 100 }];
  }

  const binCount = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(sorted.length))));
  const width = (max - min) / binCount;
  const counts = new Array<number>(binCount).fill(0);

  for (const val of sorted) {
    let idx = Math.floor((val - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    counts[idx]++;
  }

  return counts.map((count, i) => {
    const start = sanitizeFloat(min + i * width);
    const end = sanitizeFloat(min + (i + 1) * width);
    return {
      label: `${Number(start.toFixed(2))}–${Number(end.toFixed(2))}`,
      count,
      percentage: sanitizeFloat((count / sorted.length) * 100),
    };
  });
}

export function calculateStatistics(
  rawInput: string,
): StatisticsResult | StatisticsError {
  const tokens = rawInput
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return {
      ok: false,
      error: 'Enter two or more numbers separated by commas, spaces, or new lines.',
      invalidTokens: [],
    };
  }

  const values: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const num = Number(token);
    if (Number.isFinite(num)) {
      values.push(num);
    } else {
      invalidTokens.push(token);
    }
  }

  if (values.length === 0) {
    return {
      ok: false,
      error: 'No valid numeric values found in input.',
      invalidTokens,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sanitizeFloat(sorted.reduce((acc, v) => acc + v, 0));
  const mean = sanitizeFloat(sum / n);
  const median = sanitizeFloat(medianOfSorted(sorted));
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = sanitizeFloat(max - min);

  // Mode(s)
  const freq = new Map<number, number>();
  let maxFreq = 0;
  for (const v of sorted) {
    const next = (freq.get(v) ?? 0) + 1;
    freq.set(v, next);
    if (next > maxFreq) maxFreq = next;
  }

  let modes: number[] = [];
  let modeLabel = 'No mode';
  if (maxFreq > 1) {
    const candidates: number[] = [];
    for (const [val, count] of freq.entries()) {
      if (count === maxFreq) candidates.push(val);
    }
    if (candidates.length < freq.size) {
      modes = candidates;
      modeLabel = `${candidates.join(', ')} (×${maxFreq})`;
    }
  }

  // Variance & Std Dev
  const sqDiffSum = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const populationVariance = sanitizeFloat(sqDiffSum / n);
  const populationStdDev = sanitizeFloat(Math.sqrt(populationVariance));
  const sampleVariance = n >= 2 ? sanitizeFloat(sqDiffSum / (n - 1)) : null;
  const sampleStdDev =
    sampleVariance !== null ? sanitizeFloat(Math.sqrt(sampleVariance)) : null;

  // Quartiles (Tukey inclusive/exclusive split on sorted halves)
  let q1 = median;
  let q3 = median;
  if (n >= 2) {
    const mid = Math.floor(n / 2);
    const lowerHalf = sorted.slice(0, mid);
    const upperHalf = n % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
    q1 = sanitizeFloat(medianOfSorted(lowerHalf));
    q3 = sanitizeFloat(medianOfSorted(upperHalf));
  }
  const iqr = sanitizeFloat(q3 - q1);

  return {
    ok: true,
    count: n,
    sum,
    mean,
    median,
    modes,
    modeLabel,
    min,
    max,
    range,
    populationVariance,
    sampleVariance,
    populationStdDev,
    sampleStdDev,
    q1,
    q3,
    iqr,
    sortedValues: sorted,
    invalidTokens,
    bins: buildHistogram(sorted),
  };
}
