import { Minus, Plus } from 'lucide-react';
import {
  formatCurrency,
  getCurrencyOption,
  parseNumericInput,
  type CurrencyCode,
} from '../../engine/formatter.ts';
import { calculateTipSplit } from '../../engine/tipSplit.ts';
import type { TipSession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

const TIP_PRESETS = ['10', '15', '18', '20', '25'];

export function TipSplitCalculator({
  session,
  onChange,
  onReset,
  currencyCode,
  onAddHistory,
}: {
  session: TipSession;
  onChange: (updater: Partial<TipSession>) => void;
  onReset: () => void;
  currencyCode: CurrencyCode;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const currency = getCurrencyOption(currencyCode);
  const bill = parseNumericInput(session.bill);
  const tax = parseNumericInput(session.tax) ?? 0;
  const tipPct = parseNumericInput(session.tipPct) ?? 0;
  const party = parseNumericInput(session.partySize) ?? 1;

  const result =
    bill !== null
      ? calculateTipSplit({
          billAmount: bill,
          taxAmount: tax,
          tipPercent: tipPct,
          partySize: party,
          tipOnPreTax: session.tipOnPreTax,
          roundUpPerPerson: session.roundUp,
        })
      : null;

  const stepParty = (delta: number) => {
    const current = Math.max(1, Math.floor(party));
    onChange({ partySize: String(Math.max(1, current + delta)) });
  };

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Tip & Bill Split"
        subtitle="Calculate gratuity, split evenly across diners, and optionally round up per person."
        onReset={onReset}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput
          id="tip-bill"
          label="Bill Total"
          value={session.bill}
          onChange={(billVal) => onChange({ bill: billVal })}
          prefix={currency.symbol.trim()}
          placeholder="86.40"
        />

        <div>
          <label
            htmlFor="tip-party"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            Split Between (People)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepParty(-1)}
              className="btn-tactile flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              aria-label="Decrease party size"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              id="tip-party"
              type="text"
              inputMode="numeric"
              value={session.partySize}
              onChange={(e) => onChange({ partySize: e.target.value })}
              className="font-mono-tabular h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-center text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
            />
            <button
              type="button"
              onClick={() => stepParty(1)}
              className="btn-tactile flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              aria-label="Increase party size"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick tip presets */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-[#475569] dark:text-slate-300">
            Tip Percentage
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TIP_PRESETS.map((preset) => {
            const active = session.tipPct === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ tipPct: preset })}
                className={`btn-tactile font-mono-tabular h-9 rounded-md border text-xs font-semibold ${
                  active
                    ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#3B82F6] dark:bg-[#3B82F6]'
                    : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]'
                }`}
              >
                {preset}%
              </button>
            );
          })}
          <div className="flex items-center rounded-md border border-[#E2E8F0] bg-white px-2 focus-within:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A]">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Custom tip percentage"
              value={session.tipPct}
              onChange={(e) => onChange({ tipPct: e.target.value })}
              className="font-mono-tabular w-full bg-transparent text-right text-xs font-medium text-[#0F172A] outline-none dark:text-[#F1F5F9]"
            />
            <span className="font-mono-tabular ml-1 text-xs text-[#475569] dark:text-slate-400">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 dark:border-[#334155] dark:bg-[#0F172A]">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#0F172A] dark:text-slate-200">
          <input
            type="checkbox"
            checked={session.tipOnPreTax}
            onChange={(e) => onChange({ tipOnPreTax: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-[#2563EB]"
          />
          <span>Tip on pre-tax subtotal</span>
        </label>

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#0F172A] dark:text-slate-200">
          <input
            type="checkbox"
            checked={session.roundUp}
            onChange={(e) => onChange({ roundUp: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-[#2563EB]"
          />
          <span>Round up per person</span>
        </label>
      </div>

      {session.tipOnPreTax && (
        <div className="max-w-xs">
          <FieldInput
            id="tip-tax"
            label="Included Tax Amount"
            value={session.tax}
            onChange={(taxVal) => onChange({ tax: taxVal })}
            prefix={currency.symbol.trim()}
            placeholder="6.40"
          />
        </div>
      )}

      {result ? (
        <>
          {result.warnings.length > 0 && (
            <InlineAlert tone="warning">{result.warnings.join(' ')}</InlineAlert>
          )}
          {result.roundingNote && (
            <InlineAlert tone="info">{result.roundingNote}</InlineAlert>
          )}
          <PrimaryResultCard
            label={result.partySize > 1 ? 'Total Per Person' : 'Total With Tip'}
            value={formatCurrency(
              result.perPerson,
              currency.symbol,
              currency.decimals,
            )}
            subtext={`Includes ${formatCurrency(result.tipPerPerson, currency.symbol, currency.decimals)} tip per person`}
            formula={result.formula}
            onSave={() =>
              onAddHistory(
                `${formatCurrency(bill ?? 0, currency.symbol, currency.decimals)} + ${tipPct}% ÷ ${result.partySize}`,
                `${formatCurrency(result.perPerson, currency.symbol, currency.decimals)} / person`,
              )
            }
          >
            <div className="grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#334155]">
              <div>
                <div className="text-[#475569] dark:text-slate-400">Tip Base</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatCurrency(result.tipBase, currency.symbol, currency.decimals)}
                </div>
              </div>
              <div>
                <div className="text-[#475569] dark:text-slate-400">Total Tip</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  {formatCurrency(result.tipAmount, currency.symbol, currency.decimals)}
                </div>
              </div>
              <div>
                <div className="text-[#475569] dark:text-slate-400">Grand Total</div>
                <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  {formatCurrency(result.totalBill, currency.symbol, currency.decimals)}
                </div>
              </div>
            </div>
          </PrimaryResultCard>
        </>
      ) : (
        <InlineAlert tone="info">
          Enter a bill amount to calculate tip and split totals.
        </InlineAlert>
      )}
    </div>
  );
}
