import { formatNumber } from '../../engine/formatter.ts';
import { calculateStatistics } from '../../engine/statistics.ts';
import type { StatisticsSession } from '../../state/useSessionCache.ts';
import { BoxPlotChart } from '../shared/Charts.tsx';
import {
  InlineAlert,
  PrimaryResultCard,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

const SAMPLE_DATA = '14, 18, 21, 21, 24, 29, 32, 35, 41';

export function StatisticsCalculator({
  session,
  onChange,
  onReset,
  onAddHistory,
}: {
  session: StatisticsSession;
  onChange: (updater: Partial<StatisticsSession>) => void;
  onReset: () => void;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const result = calculateStatistics(session.rawInput);
  const maxBinCount =
    result.ok && result.bins.length > 0
      ? Math.max(...result.bins.map((b) => b.count))
      : 1;

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Basic Statistics"
        subtitle="Paste numbers separated by commas, spaces, or new lines for full descriptive analytics."
        onReset={onReset}
      />

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="stats-input"
            className="text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            Dataset Values
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ rawInput: SAMPLE_DATA })}
              className="text-xs font-medium text-[#2563EB] hover:underline dark:text-[#60A5FA]"
            >
              Load Sample Data
            </button>
            <button
              type="button"
              onClick={() => onChange({ rawInput: '' })}
              className="text-xs font-medium text-[#475569] hover:text-[#DC2626] dark:text-slate-400"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          id="stats-input"
          rows={4}
          value={session.rawInput}
          onChange={(e) => onChange({ rawInput: e.target.value })}
          placeholder="e.g. 12, 15, 18, 22, 22, 27"
          className="font-mono-tabular w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
        />
      </div>

      {result.invalidTokens.length > 0 && (
        <InlineAlert tone="warning">
          Ignored {result.invalidTokens.length} non-numeric token(s):{' '}
          <span className="font-mono-tabular">
            {result.invalidTokens.slice(0, 8).join(', ')}
            {result.invalidTokens.length > 8 ? '…' : ''}
          </span>
        </InlineAlert>
      )}

      {!result.ok ? (
        <InlineAlert tone="info">{result.error}</InlineAlert>
      ) : (
        <>
          <PrimaryResultCard
            label={`Mean (Average) · n = ${result.count}`}
            value={formatNumber(result.mean, { maxDecimals: 6 })}
            subtext={`Median: ${formatNumber(result.median, { maxDecimals: 6 })} · Mode: ${result.modeLabel}`}
            onSave={() =>
              onAddHistory(
                `Stats (n=${result.count}, Sum=${formatNumber(result.sum)})`,
                `Mean ${formatNumber(result.mean, { maxDecimals: 4 })} · Median ${formatNumber(result.median, { maxDecimals: 4 })}`,
              )
            }
          >
            <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3 text-xs sm:grid-cols-4 dark:border-[#334155]">
              <div>
                <div className="text-[#475569] dark:text-slate-400">Sum</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatNumber(result.sum, { maxDecimals: 6 })}
                </div>
              </div>
              <div>
                <div className="text-[#475569] dark:text-slate-400">Min / Max</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatNumber(result.min)} / {formatNumber(result.max)}
                </div>
              </div>
              <div>
                <div className="text-[#475569] dark:text-slate-400">Range</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatNumber(result.range, { maxDecimals: 6 })}
                </div>
              </div>
              <div>
                <div className="text-[#475569] dark:text-slate-400">
                  Quartiles (Q1 / Q3)
                </div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatNumber(result.q1, { maxDecimals: 4 })} /{' '}
                  {formatNumber(result.q3, { maxDecimals: 4 })}
                </div>
              </div>
            </div>
          </PrimaryResultCard>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 dark:border-[#334155] dark:bg-[#0F172A]">
              <div className="text-[11px] text-[#475569] dark:text-slate-400">
                Sample Std Dev (s)
              </div>
              <div className="font-mono-tabular mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {result.sampleStdDev !== null
                  ? formatNumber(result.sampleStdDev, { maxDecimals: 6 })
                  : 'N/A (needs ≥ 2 values)'}
              </div>
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 dark:border-[#334155] dark:bg-[#0F172A]">
              <div className="text-[11px] text-[#475569] dark:text-slate-400">
                Pop. Std Dev (σ)
              </div>
              <div className="font-mono-tabular mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {formatNumber(result.populationStdDev, { maxDecimals: 6 })}
              </div>
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 dark:border-[#334155] dark:bg-[#0F172A]">
              <div className="text-[11px] text-[#475569] dark:text-slate-400">
                Sample Variance (s²)
              </div>
              <div className="font-mono-tabular mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {result.sampleVariance !== null
                  ? formatNumber(result.sampleVariance, { maxDecimals: 6 })
                  : 'N/A (needs ≥ 2 values)'}
              </div>
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 dark:border-[#334155] dark:bg-[#0F172A]">
              <div className="text-[11px] text-[#475569] dark:text-slate-400">
                Interquartile Range (IQR)
              </div>
              <div className="font-mono-tabular mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {formatNumber(result.iqr, { maxDecimals: 6 })}
              </div>
            </div>
          </div>

          <BoxPlotChart
            min={result.min}
            q1={result.q1}
            median={result.median}
            q3={result.q3}
            max={result.max}
            mean={result.mean}
          />

          {/* Inline Distribution Bar Chart */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#334155] dark:bg-[#0F172A]">
            <div className="mb-3 text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
              Value Distribution
            </div>
            <div className="space-y-2">
              {result.bins.map((bin, idx) => (
                <div
                  key={`${bin.label}-${idx}`}
                  className="grid grid-cols-[110px_1fr_48px] items-center gap-3 text-xs"
                >
                  <span className="font-mono-tabular truncate text-[#475569] dark:text-slate-400">
                    {bin.label}
                  </span>
                  <div className="h-3 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded bg-[#2563EB] dark:bg-[#3B82F6]"
                      style={{
                        width: `${Math.max(4, (bin.count / maxBinCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono-tabular text-right font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                    {bin.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
