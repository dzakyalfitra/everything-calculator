import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  computeBmiGaugePercent,
  computeBoxPlotPositions,
  computeNiceTicks,
  formatCompactNumber,
  type CompoundChartPoint,
  type LoanChartPoint,
} from '../../engine/chartGeometry.ts';
import { formatCurrency, formatNumber } from '../../engine/formatter.ts';
import type { BmiBand } from '../../engine/health.ts';

const SVG_W = 600;
const SVG_H = 220;
const PAD = { top: 14, right: 16, bottom: 28, left: 62 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

function xForIndex(idx: number, count: number): number {
  if (count <= 1) return PAD.left + PLOT_W / 2;
  return PAD.left + (idx / (count - 1)) * PLOT_W;
}

function yForValue(val: number, maxTick: number): number {
  const ratio = maxTick > 0 ? Math.min(1, Math.max(0, val / maxTick)) : 0;
  return PAD.top + PLOT_H - ratio * PLOT_H;
}

function buildPolylinePath(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function buildBandAreaPath(
  topPoints: { x: number; y: number }[],
  bottomPoints: { x: number; y: number }[],
): string {
  if (topPoints.length === 0) return '';
  const forward = buildPolylinePath(topPoints);
  const backward = [...bottomPoints]
    .reverse()
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  return `${forward} ${backward} Z`;
}

function pickXTickIndices(count: number, maxLabels = 6): number[] {
  if (count <= 1) return [0];
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil((count - 1) / (maxLabels - 1));
  const indices: number[] = [];
  for (let i = 0; i < count - 1; i += step) {
    indices.push(i);
  }
  if (indices[indices.length - 1] !== count - 1) {
    indices.push(count - 1);
  }
  return indices;
}

function TimeSeriesShell({
  title,
  count,
  maxValue,
  years,
  yPrefix,
  activeIndex,
  onSelectIndex,
  legend,
  readout,
  children,
}: {
  title: string;
  count: number;
  maxValue: number;
  years: number[];
  yPrefix: string;
  activeIndex: number;
  onSelectIndex: (idx: number | null) => void;
  legend: ReactNode;
  readout: ReactNode;
  children: (helpers: {
    xAt: (idx: number) => number;
    yAt: (val: number) => number;
    maxTick: number;
  }) => ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { maxTick, ticks } = computeNiceTicks(maxValue, 4);
  const xAt = (idx: number) => xForIndex(idx, count);
  const yAt = (val: number) => yForValue(val, maxTick);
  const xTickIndices = pickXTickIndices(count);

  const handlePointer = (e: PointerEvent<SVGSVGElement>) => {
    if (count <= 1 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const clamped = Math.min(PAD.left + PLOT_W, Math.max(PAD.left, relX));
    const ratio = (clamped - PAD.left) / PLOT_W;
    const idx = Math.round(ratio * (count - 1));
    onSelectIndex(Math.min(count - 1, Math.max(0, idx)));
  };

  const handleKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (count <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelectIndex(Math.max(0, activeIndex - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelectIndex(Math.min(count - 1, activeIndex + 1));
    }
  };

  const activeX = xAt(activeIndex);

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#334155] dark:bg-[#0F172A]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
          {title}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#475569] dark:text-slate-400">
          {legend}
        </div>
      </div>

      {/* Live readout bar for hovered/selected year */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs dark:border-[#334155] dark:bg-[#1E293B]">
        {readout}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label={title}
        tabIndex={0}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onSelectIndex(null)}
        onKeyDown={handleKeyDown}
        className="h-auto w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
      >
        {/* Horizontal Gridlines & Y-Axis Labels */}
        {ticks.map((tick) => {
          const y = yAt(tick);
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + PLOT_W}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="font-mono-tabular fill-[#475569] text-[10px] dark:fill-slate-400"
              >
                {formatCompactNumber(tick, yPrefix)}
              </text>
            </g>
          );
        })}

        {/* Data Series */}
        {children({ xAt, yAt, maxTick })}

        {/* Active Year Crosshair */}
        <line
          x1={activeX}
          y1={PAD.top}
          x2={activeX}
          y2={PAD.top + PLOT_H}
          className="stroke-slate-400 dark:stroke-slate-500"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {/* X-Axis Labels */}
        {xTickIndices.map((idx) => (
          <text
            key={idx}
            x={xAt(idx)}
            y={SVG_H - 8}
            textAnchor={
              idx === 0 && count > 1
                ? 'start'
                : idx === count - 1 && count > 1
                  ? 'end'
                  : 'middle'
            }
            className="font-mono-tabular fill-[#475569] text-[10px] dark:fill-slate-400"
          >
            Yr {years[idx]}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function CompoundGrowthChart({
  series,
  currencySymbol,
  currencyDecimals,
}: {
  series: CompoundChartPoint[];
  currencySymbol: string;
  currencyDecimals: number;
}) {
  const gradInterestId = useId();
  const gradContribId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length === 0) return null;

  const activeIdx =
    hoverIdx !== null && hoverIdx < series.length ? hoverIdx : series.length - 1;
  const activePt = series[activeIdx];
  const maxVal = Math.max(...series.map((p) => p.balance), 1);

  return (
    <TimeSeriesShell
      title="Growth Projection Over Time"
      count={series.length}
      maxValue={maxVal}
      years={series.map((p) => p.year)}
      yPrefix={currencySymbol.trim()}
      activeIndex={activeIdx}
      onSelectIndex={setHoverIdx}
      legend={
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#2563EB] dark:bg-[#3B82F6]" />
            Contributions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#16A34A]" />
            Interest Earned
          </span>
        </>
      }
      readout={
        <>
          <span className="font-mono-tabular font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
            Year {activePt.year}
          </span>
          <div className="font-mono-tabular flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[#475569] dark:text-slate-400">
              Contrib:{' '}
              <strong className="text-[#2563EB] dark:text-[#60A5FA]">
                {formatCurrency(activePt.contributions, currencySymbol, currencyDecimals)}
              </strong>
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              Interest:{' '}
              <strong className="text-[#16A34A] dark:text-emerald-400">
                {formatCurrency(activePt.interest, currencySymbol, currencyDecimals)}
              </strong>
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              Balance:{' '}
              <strong className="text-[#0F172A] dark:text-[#F1F5F9]">
                {formatCurrency(activePt.balance, currencySymbol, currencyDecimals)}
              </strong>
            </span>
          </div>
        </>
      }
    >
      {({ xAt, yAt }) => {
        const baselinePts = series.map((_, i) => ({ x: xAt(i), y: yAt(0) }));
        const contribPts = series.map((p, i) => ({
          x: xAt(i),
          y: yAt(p.contributions),
        }));
        const balancePts = series.map((p, i) => ({
          x: xAt(i),
          y: yAt(p.balance),
        }));

        const activeX = xAt(activeIdx);

        return (
          <>
            <defs>
              <linearGradient id={gradContribId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.06" />
              </linearGradient>
              <linearGradient id={gradInterestId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {series.length > 1 && (
              <>
                <path
                  d={buildBandAreaPath(contribPts, baselinePts)}
                  fill={`url(#${gradContribId})`}
                />
                <path
                  d={buildBandAreaPath(balancePts, contribPts)}
                  fill={`url(#${gradInterestId})`}
                />
                <path
                  d={buildPolylinePath(contribPts)}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={2}
                />
                <path
                  d={buildPolylinePath(balancePts)}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth={2.25}
                />
              </>
            )}

            <circle
              cx={activeX}
              cy={yAt(activePt.contributions)}
              r={4}
              className="fill-[#2563EB] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1.5}
            />
            <circle
              cx={activeX}
              cy={yAt(activePt.balance)}
              r={4.5}
              className="fill-[#16A34A] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1.5}
            />
          </>
        );
      }}
    </TimeSeriesShell>
  );
}

export function LoanAmortizationChart({
  series,
  currencySymbol,
  currencyDecimals,
}: {
  series: LoanChartPoint[];
  currencySymbol: string;
  currencyDecimals: number;
}) {
  const gradBalanceId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length === 0) return null;

  const activeIdx =
    hoverIdx !== null && hoverIdx < series.length ? hoverIdx : series.length - 1;
  const activePt = series[activeIdx];
  const maxVal = Math.max(
    ...series.flatMap((p) => [
      p.remainingBalance,
      p.cumulativePrincipal,
      p.cumulativeInterest,
    ]),
    1,
  );

  return (
    <TimeSeriesShell
      title="Loan Paydown & Cumulative Payments"
      count={series.length}
      maxValue={maxVal}
      years={series.map((p) => p.year)}
      yPrefix={currencySymbol.trim()}
      activeIndex={activeIdx}
      onSelectIndex={setHoverIdx}
      legend={
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#2563EB] dark:bg-[#3B82F6]" />
            Remaining Balance
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#16A34A]" />
            Principal Paid
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#D97706]" />
            Interest Paid
          </span>
        </>
      }
      readout={
        <>
          <span className="font-mono-tabular font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
            Year {activePt.year}
          </span>
          <div className="font-mono-tabular flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[#475569] dark:text-slate-400">
              Balance:{' '}
              <strong className="text-[#2563EB] dark:text-[#60A5FA]">
                {formatCurrency(activePt.remainingBalance, currencySymbol, currencyDecimals)}
              </strong>
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              Principal:{' '}
              <strong className="text-[#16A34A] dark:text-emerald-400">
                {formatCurrency(activePt.cumulativePrincipal, currencySymbol, currencyDecimals)}
              </strong>
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              Interest:{' '}
              <strong className="text-[#D97706]">
                {formatCurrency(activePt.cumulativeInterest, currencySymbol, currencyDecimals)}
              </strong>
            </span>
          </div>
        </>
      }
    >
      {({ xAt, yAt }) => {
        const baselinePts = series.map((_, i) => ({ x: xAt(i), y: yAt(0) }));
        const balancePts = series.map((p, i) => ({
          x: xAt(i),
          y: yAt(p.remainingBalance),
        }));
        const principalPts = series.map((p, i) => ({
          x: xAt(i),
          y: yAt(p.cumulativePrincipal),
        }));
        const interestPts = series.map((p, i) => ({
          x: xAt(i),
          y: yAt(p.cumulativeInterest),
        }));

        const activeX = xAt(activeIdx);

        return (
          <>
            <defs>
              <linearGradient id={gradBalanceId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {series.length > 1 && (
              <>
                <path
                  d={buildBandAreaPath(balancePts, baselinePts)}
                  fill={`url(#${gradBalanceId})`}
                />
                <path
                  d={buildPolylinePath(balancePts)}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={2.25}
                />
                <path
                  d={buildPolylinePath(principalPts)}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth={2}
                />
                <path
                  d={buildPolylinePath(interestPts)}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth={2}
                />
              </>
            )}

            <circle
              cx={activeX}
              cy={yAt(activePt.remainingBalance)}
              r={4.5}
              className="fill-[#2563EB] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1.5}
            />
            <circle
              cx={activeX}
              cy={yAt(activePt.cumulativePrincipal)}
              r={4}
              className="fill-[#16A34A] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1.5}
            />
            <circle
              cx={activeX}
              cy={yAt(activePt.cumulativeInterest)}
              r={4}
              className="fill-[#D97706] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1.5}
            />
          </>
        );
      }}
    </TimeSeriesShell>
  );
}

export function BoxPlotChart({
  min,
  q1,
  median,
  q3,
  max,
  mean,
}: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}) {
  const pos = computeBoxPlotPositions({ min, q1, median, q3, max, mean });
  const w = 560;
  const h = 84;
  const padX = 28;
  const trackW = w - padX * 2;
  const x = (norm: number) => padX + norm * trackW;
  const cy = 34;

  const boxLeft = x(pos.q1);
  const boxRight = x(pos.q3);
  const boxW = Math.max(2, boxRight - boxLeft);
  const meanX = x(pos.mean);

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#334155] dark:bg-[#0F172A]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
          Five-Number Summary (Box Plot)
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#475569] dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-xs border border-[#2563EB] bg-[#2563EB]/20" />
            IQR (Q1–Q3)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-0.5 bg-[#0F172A] dark:bg-slate-100" />
            Median
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 bg-[#D97706]" />
            Mean
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Box-and-whisker plot of dataset"
        className="h-auto w-full select-none"
      >
        {/* Baseline axis */}
        <line
          x1={padX}
          y1={cy}
          x2={padX + trackW}
          y2={cy}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={1}
        />

        {pos.isDegenerate ? (
          <>
            <circle
              cx={x(0.5)}
              cy={cy}
              r={6}
              className="fill-[#2563EB] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={2}
            />
            <text
              x={x(0.5)}
              y={66}
              textAnchor="middle"
              className="font-mono-tabular fill-[#475569] text-[11px] dark:fill-slate-400"
            >
              All values equal ({formatNumber(median, { maxDecimals: 4 })})
            </text>
          </>
        ) : (
          <>
            {/* Whiskers */}
            <line
              x1={x(pos.min)}
              y1={cy}
              x2={boxLeft}
              y2={cy}
              className="stroke-slate-400 dark:stroke-slate-500"
              strokeWidth={1.75}
            />
            <line
              x1={boxRight}
              y1={cy}
              x2={x(pos.max)}
              y2={cy}
              className="stroke-slate-400 dark:stroke-slate-500"
              strokeWidth={1.75}
            />
            {/* Min & Max end caps */}
            <line
              x1={x(pos.min)}
              y1={cy - 10}
              x2={x(pos.min)}
              y2={cy + 10}
              className="stroke-slate-500 dark:stroke-slate-400"
              strokeWidth={2}
            />
            <line
              x1={x(pos.max)}
              y1={cy - 10}
              x2={x(pos.max)}
              y2={cy + 10}
              className="stroke-slate-500 dark:stroke-slate-400"
              strokeWidth={2}
            />

            {/* IQR Box */}
            <rect
              x={boxLeft}
              y={cy - 14}
              width={boxW}
              height={28}
              rx={3}
              className="fill-[#2563EB]/20 stroke-[#2563EB] dark:fill-[#3B82F6]/25 dark:stroke-[#3B82F6]"
              strokeWidth={2}
            />

            {/* Median Line */}
            <line
              x1={x(pos.median)}
              y1={cy - 14}
              x2={x(pos.median)}
              y2={cy + 14}
              className="stroke-[#0F172A] dark:stroke-[#F1F5F9]"
              strokeWidth={2.5}
            />

            {/* Mean Diamond */}
            <polygon
              points={`${meanX},${cy - 5} ${meanX + 5},${cy} ${meanX},${cy + 5} ${meanX - 5},${cy}`}
              className="fill-[#D97706] stroke-white dark:stroke-[#0F172A]"
              strokeWidth={1}
            />

            {/* Labels */}
            <text
              x={x(pos.min)}
              y={68}
              textAnchor="start"
              className="font-mono-tabular fill-[#475569] text-[10px] dark:fill-slate-400"
            >
              Min {formatNumber(min, { maxDecimals: 2 })}
            </text>
            <text
              x={x(pos.median)}
              y={13}
              textAnchor="middle"
              className="font-mono-tabular fill-[#0F172A] text-[10px] font-semibold dark:fill-[#F1F5F9]"
            >
              Med {formatNumber(median, { maxDecimals: 2 })}
            </text>
            <text
              x={x(pos.max)}
              y={68}
              textAnchor="end"
              className="font-mono-tabular fill-[#475569] text-[10px] dark:fill-slate-400"
            >
              Max {formatNumber(max, { maxDecimals: 2 })}
            </text>
          </>
        )}
      </svg>

      {!pos.isDegenerate && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-2 text-[11px] text-[#475569] dark:border-[#334155] dark:text-slate-400">
          <span className="font-mono-tabular">
            Q1: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{formatNumber(q1, { maxDecimals: 4 })}</strong>
          </span>
          <span className="font-mono-tabular">
            Median: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{formatNumber(median, { maxDecimals: 4 })}</strong>
          </span>
          <span className="font-mono-tabular">
            Mean: <strong className="text-[#D97706]">{formatNumber(mean, { maxDecimals: 4 })}</strong>
          </span>
          <span className="font-mono-tabular">
            Q3: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{formatNumber(q3, { maxDecimals: 4 })}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

function bandAccentColor(category: BmiBand): string {
  switch (category) {
    case 'Underweight':
      return 'bg-[#2563EB] dark:bg-[#3B82F6]';
    case 'Normal weight':
      return 'bg-[#16A34A]';
    case 'Overweight':
      return 'bg-[#D97706]';
    case 'Obesity':
      return 'bg-[#DC2626]';
  }
}

export function BmiSpectrumGauge({
  bmi,
  category,
}: {
  bmi: number;
  category: BmiBand;
}) {
  const pct = computeBmiGaugePercent(bmi);
  const clampedLabelPct = Math.min(92, Math.max(8, pct));
  const pinColor = bandAccentColor(category);

  return (
    <div className="pt-1">
      <div className="relative h-6">
        <div
          className="font-mono-tabular absolute top-0 -translate-x-1/2 rounded bg-[#0F172A] px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-[#F1F5F9] dark:text-[#0F172A]"
          style={{ left: `${clampedLabelPct}%` }}
        >
          You: {bmi}
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium">
          <div className="rounded bg-[#2563EB]/20 py-1.5 text-[#1D4ED8] dark:text-blue-300">
            &lt; 18.5
          </div>
          <div className="rounded bg-[#16A34A]/20 py-1.5 text-[#15803D] dark:text-emerald-300">
            18.5 – 24.9
          </div>
          <div className="rounded bg-[#D97706]/20 py-1.5 text-[#B45309] dark:text-amber-300">
            25 – 29.9
          </div>
          <div className="rounded bg-[#DC2626]/20 py-1.5 text-[#DC2626] dark:text-red-300">
            ≥ 30
          </div>
        </div>

        {/* Live position needle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 bottom-0 -translate-x-1/2"
          style={{ left: `${pct}%` }}
        >
          <div className={`mx-auto h-full w-0.5 ${pinColor}`} />
          <div
            className={`mx-auto -mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0F172A] ${pinColor}`}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-[#475569] dark:text-slate-400">
        <span>Under</span>
        <span>Normal</span>
        <span>Over</span>
        <span>Obese</span>
      </div>
    </div>
  );
}
