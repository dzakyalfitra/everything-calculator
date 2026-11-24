import { ArrowLeftRight } from 'lucide-react';
import { formatNumber, parseNumericInput } from '../../engine/formatter.ts';
import {
  convertUnit,
  UNIT_CATEGORIES,
  type UnitCategoryId,
} from '../../engine/unitConverter.ts';
import type { UnitSession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

export function UnitConverterCalculator({
  session,
  onChange,
  onReset,
  onAddHistory,
}: {
  session: UnitSession;
  onChange: (updater: Partial<UnitSession>) => void;
  onReset: () => void;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const category =
    UNIT_CATEGORIES.find((c) => c.id === session.category) ?? UNIT_CATEGORIES[0];

  const handleCategoryChange = (catId: UnitCategoryId) => {
    const nextCat = UNIT_CATEGORIES.find((c) => c.id === catId)!;
    onChange({
      category: catId,
      fromUnit: nextCat.units[0].id,
      toUnit: nextCat.units[Math.min(1, nextCat.units.length - 1)].id,
    });
  };

  const handleSwap = () => {
    onChange({
      fromUnit: session.toUnit,
      toUnit: session.fromUnit,
    });
  };

  const numericValue = parseNumericInput(session.value);
  const result =
    numericValue !== null
      ? convertUnit(
          category.id,
          numericValue,
          session.fromUnit,
          session.toUnit,
        )
      : null;

  const fromUnitObj = category.units.find((u) => u.id === session.fromUnit);
  const toUnitObj = category.units.find((u) => u.id === session.toUnit);

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Unit Converter"
        subtitle="Instant bidirectional conversion across length, mass, temperature, cooking volume, area, speed, and data."
        onReset={onReset}
      />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {UNIT_CATEGORIES.map((cat) => {
          const active = cat.id === category.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`btn-tactile rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                active
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#3B82F6] dark:bg-[#3B82F6]'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] dark:border-[#334155] dark:bg-[#0F172A] dark:text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Input & selectors */}
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
        <FieldInput
          id="unit-value"
          label="Value"
          value={session.value}
          onChange={(value) => onChange({ value })}
          placeholder="10"
        />

        <div>
          <label
            htmlFor="unit-from"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            From
          </label>
          <select
            id="unit-from"
            value={session.fromUnit}
            onChange={(e) => onChange({ fromUnit: e.target.value })}
            className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          >
            {category.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="btn-tactile flex h-[38px] items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-[#0F172A] hover:bg-slate-100 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9] dark:hover:bg-slate-800"
          aria-label="Swap units"
          title="Swap From and To units"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div>
          <label
            htmlFor="unit-to"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            To
          </label>
          <select
            id="unit-to"
            value={session.toUnit}
            onChange={(e) => onChange({ toUnit: e.target.value })}
            className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          >
            {category.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {result === null ? (
        <InlineAlert tone="info">Enter a numeric value to convert.</InlineAlert>
      ) : !result.ok ? (
        <InlineAlert tone="error">{result.error}</InlineAlert>
      ) : (
        <>
          <PrimaryResultCard
            label={`${numericValue} ${fromUnitObj?.symbol ?? ''} equals`}
            value={`${formatNumber(result.value, { maxDecimals: 8 })} ${toUnitObj?.symbol ?? ''}`}
            copyValue={formatNumber(result.value, { maxDecimals: 8 })}
            formula={result.formula}
            onSave={() =>
              onAddHistory(
                `${numericValue} ${fromUnitObj?.symbol} → ${toUnitObj?.symbol}`,
                `${formatNumber(result.value, { maxDecimals: 6 })} ${toUnitObj?.symbol}`,
              )
            }
          />

          <div>
            <div className="mb-2 text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
              All {category.name} Equivalents
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.allUnits.map(({ unit, value }) => (
                <div
                  key={unit.id}
                  className={`rounded-md border px-3 py-2 ${
                    unit.id === session.toUnit
                      ? 'border-[#2563EB]/40 bg-[#2563EB]/5 dark:border-[#3B82F6]/40 dark:bg-[#3B82F6]/10'
                      : 'border-[#E2E8F0] bg-white dark:border-[#334155] dark:bg-[#0F172A]'
                  }`}
                >
                  <div className="text-[11px] text-[#475569] dark:text-slate-400">
                    {unit.label}
                  </div>
                  <div className="font-mono-tabular mt-0.5 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatNumber(value, { maxDecimals: 6 })} {unit.symbol}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
