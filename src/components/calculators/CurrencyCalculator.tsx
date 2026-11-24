import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import {
  convertCurrency,
  CURRENCY_LIST,
  getReferenceExchangeRate,
  REFERENCE_RATES_NOTE,
} from '../../engine/currency.ts';
import {
  formatCurrency,
  formatNumber,
  parseNumericInput,
} from '../../engine/formatter.ts';
import type { CurrencySession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

const QUICK_AMOUNTS = [1, 10, 50, 100, 500, 1000];

export function CurrencyCalculator({
  session,
  onChange,
  onReset,
  onAddHistory,
}: {
  session: CurrencySession;
  onChange: (updater: Partial<CurrencySession>) => void;
  onReset: () => void;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const amount = parseNumericInput(session.amount);
  const customRateParsed =
    session.customRate.trim() === ''
      ? null
      : parseNumericInput(session.customRate);

  const refRate = getReferenceExchangeRate(session.fromCode, session.toCode);

  const result =
    amount !== null
      ? convertCurrency(
          amount,
          session.fromCode,
          session.toCode,
          session.customRate.trim() !== ''
            ? (customRateParsed ?? -1)
            : null,
        )
      : null;

  const handleSwap = () => {
    onChange({
      fromCode: session.toCode,
      toCode: session.fromCode,
      customRate: '',
    });
  };

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Currency Converter"
        subtitle="Offline-first converter for 24 global currencies with editable live bank/card rate override."
        onReset={onReset}
      />

      <InlineAlert tone="info">
        {REFERENCE_RATES_NOTE}. Enter a custom rate below if you want to match your bank or card rate exactly.
      </InlineAlert>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
        <FieldInput
          id="fx-amount"
          label="Amount"
          value={session.amount}
          onChange={(amountVal) => onChange({ amount: amountVal })}
          placeholder="100"
        />

        <div>
          <label
            htmlFor="fx-from"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            From
          </label>
          <select
            id="fx-from"
            value={session.fromCode}
            onChange={(e) =>
              onChange({ fromCode: e.target.value, customRate: '' })
            }
            className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          >
            {CURRENCY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="btn-tactile flex h-[38px] items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-[#0F172A] hover:bg-slate-100 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          aria-label="Swap currencies"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div>
          <label
            htmlFor="fx-to"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            To
          </label>
          <select
            id="fx-to"
            value={session.toCode}
            onChange={(e) =>
              onChange({ toCode: e.target.value, customRate: '' })
            }
            className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          >
            {CURRENCY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Rate Override */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#334155] dark:bg-[#0F172A]">
        <div className="min-w-[220px] flex-1">
          <FieldInput
            id="fx-custom-rate"
            label={`Edit Rate (1 ${session.fromCode} = ? ${session.toCode})`}
            value={session.customRate}
            onChange={(customRate) => onChange({ customRate })}
            placeholder={`Reference: ${formatNumber(refRate, { maxDecimals: 6 })}`}
            hint={
              session.customRate.trim() !== ''
                ? 'Using your custom override rate'
                : `Using built-in reference rate (${formatNumber(refRate, { maxDecimals: 6 })})`
            }
          />
        </div>
        {session.customRate.trim() !== '' && (
          <button
            type="button"
            onClick={() => onChange({ customRate: '' })}
            className="btn-tactile mb-5 inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Use Reference</span>
          </button>
        )}
      </div>

      {result === null ? (
        <InlineAlert tone="info">Enter an amount to convert.</InlineAlert>
      ) : !result.ok ? (
        <InlineAlert tone="error">{result.error}</InlineAlert>
      ) : (
        <>
          <PrimaryResultCard
            label={`${formatCurrency(amount ?? 0, result.fromCurrency.symbol, result.fromCurrency.decimals)} ${result.fromCurrency.code} equals`}
            value={`${formatCurrency(result.convertedAmount, result.toCurrency.symbol, result.toCurrency.decimals)} ${result.toCurrency.code}`}
            copyValue={formatNumber(result.convertedAmount, {
              maxDecimals: result.toCurrency.decimals,
            })}
            subtext={`Rate: 1 ${result.fromCurrency.code} = ${formatNumber(result.effectiveRate, { maxDecimals: 6 })} ${result.toCurrency.code} ${result.isCustomRate ? '(Custom)' : '(Reference)'}`}
            formula={result.formula}
            onSave={() =>
              onAddHistory(
                `${formatNumber(amount ?? 0)} ${result.fromCurrency.code} → ${result.toCurrency.code}`,
                `${formatCurrency(result.convertedAmount, result.toCurrency.symbol, result.toCurrency.decimals)} ${result.toCurrency.code}`,
              )
            }
          />

          <div>
            <div className="mb-2 text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
              Quick Reference Table
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_AMOUNTS.map((q) => (
                <div
                  key={q}
                  className="font-mono-tabular flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs dark:border-[#334155] dark:bg-[#0F172A]"
                >
                  <span className="text-[#475569] dark:text-slate-400">
                    {formatNumber(q)} {result.fromCurrency.code}
                  </span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatCurrency(
                      q * result.effectiveRate,
                      result.toCurrency.symbol,
                      result.toCurrency.decimals,
                    )}
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
