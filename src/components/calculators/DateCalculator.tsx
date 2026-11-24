import { addDateOffset, calculateDateDifference } from '../../engine/dateCalc.ts';
import { formatNumber, parseNumericInput } from '../../engine/formatter.ts';
import type { DateSession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  SegmentedTabs,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function DateCalculator({
  session,
  onChange,
  onReset,
  onAddHistory,
}: {
  session: DateSession;
  onChange: (updater: Partial<DateSession>) => void;
  onReset: () => void;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const diffResult = calculateDateDifference(session.startDate, session.endDate);

  const y = parseNumericInput(session.years) ?? 0;
  const m = parseNumericInput(session.months) ?? 0;
  const w = parseNumericInput(session.weeks) ?? 0;
  const d = parseNumericInput(session.days) ?? 0;
  const offsetResult = addDateOffset(
    session.baseDate,
    session.direction,
    y,
    m,
    w,
    d,
  );

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Date & Age Difference"
        subtitle="Leap-year safe UTC calendar arithmetic, weekday finder, and date offset calculator."
        onReset={onReset}
      />

      <SegmentedTabs
        value={session.tab}
        onChange={(tab) => onChange({ tab })}
        options={[
          { id: 'diff', label: 'Date & Age Span' },
          { id: 'offset', label: 'Add / Subtract Time' },
        ]}
      />

      {session.tab === 'diff' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="date-start"
                  className="text-xs font-medium text-[#475569] dark:text-slate-300"
                >
                  Start Date (or Birth Date)
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ startDate: todayIso() })}
                  className="text-[11px] font-medium text-[#2563EB] hover:underline dark:text-[#60A5FA]"
                >
                  Today
                </button>
              </div>
              <input
                id="date-start"
                type="date"
                value={session.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="font-mono-tabular h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="date-end"
                  className="text-xs font-medium text-[#475569] dark:text-slate-300"
                >
                  End Date
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ endDate: todayIso() })}
                  className="text-[11px] font-medium text-[#2563EB] hover:underline dark:text-[#60A5FA]"
                >
                  Today
                </button>
              </div>
              <input
                id="date-end"
                type="date"
                value={session.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className="font-mono-tabular h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>
          </div>

          {!diffResult.ok ? (
            <InlineAlert tone="error">{diffResult.error}</InlineAlert>
          ) : (
            <>
              {diffResult.note && (
                <InlineAlert tone="warning">{diffResult.note}</InlineAlert>
              )}
              <PrimaryResultCard
                label="Exact Calendar Span"
                value={`${diffResult.years}y ${diffResult.months}m ${diffResult.days}d`}
                subtext={`${formatNumber(diffResult.totalDays)} total days · ${diffResult.startWeekday} → ${diffResult.endWeekday}`}
                onSave={() =>
                  onAddHistory(
                    `${session.startDate} → ${session.endDate}`,
                    `${diffResult.years}y ${diffResult.months}m ${diffResult.days}d (${formatNumber(diffResult.totalDays)} days)`,
                  )
                }
              >
                <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3 text-xs sm:grid-cols-4 dark:border-[#334155]">
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Total Days
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatNumber(diffResult.totalDays)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Weeks + Days
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatNumber(diffResult.weeks)}w {diffResult.remainderDays}d
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Total Hours
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatNumber(diffResult.totalHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Next Anniversary
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                      {formatNumber(diffResult.daysUntilNextAnniversary)} days
                    </div>
                  </div>
                </div>
              </PrimaryResultCard>
            </>
          )}
        </div>
      )}

      {session.tab === 'offset' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="date-base"
                className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Starting Date
              </label>
              <input
                id="date-base"
                type="date"
                value={session.baseDate}
                onChange={(e) => onChange({ baseDate: e.target.value })}
                className="font-mono-tabular h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300">
                Direction
              </span>
              <SegmentedTabs
                value={session.direction}
                onChange={(direction) => onChange({ direction })}
                options={[
                  { id: 'add', label: 'Add (+)' },
                  { id: 'subtract', label: 'Subtract (−)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FieldInput
              id="off-years"
              label="Years"
              value={session.years}
              onChange={(years) => onChange({ years })}
              inputMode="numeric"
            />
            <FieldInput
              id="off-months"
              label="Months"
              value={session.months}
              onChange={(months) => onChange({ months })}
              inputMode="numeric"
            />
            <FieldInput
              id="off-weeks"
              label="Weeks"
              value={session.weeks}
              onChange={(weeks) => onChange({ weeks })}
              inputMode="numeric"
            />
            <FieldInput
              id="off-days"
              label="Days"
              value={session.days}
              onChange={(days) => onChange({ days })}
              inputMode="numeric"
            />
          </div>

          {!offsetResult.ok ? (
            <InlineAlert tone="error">{offsetResult.error}</InlineAlert>
          ) : (
            <PrimaryResultCard
              label="Resulting Date"
              value={offsetResult.resultIso}
              subtext={`Falls on a ${offsetResult.weekday}`}
              formula={offsetResult.formula}
              onSave={() =>
                onAddHistory(
                  `${session.baseDate} ${session.direction === 'add' ? '+' : '−'} ${y}y ${m}m ${w}w ${d}d`,
                  `${offsetResult.resultIso} (${offsetResult.weekday})`,
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
