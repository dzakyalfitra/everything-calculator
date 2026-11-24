import {
  formatCurrency,
  formatNumber,
  getCurrencyOption,
  parseNumericInput,
  type CurrencyCode,
} from '../../engine/formatter.ts';
import {
  calculateDiscountAndTax,
  calculatePercentChange,
  calculatePercentOf,
} from '../../engine/percentage.ts';
import type { PercentageSession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  SegmentedTabs,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

export function PercentageCalculator({
  session,
  onChange,
  onReset,
  currencyCode,
  onAddHistory,
}: {
  session: PercentageSession;
  onChange: (updater: Partial<PercentageSession>) => void;
  onReset: () => void;
  currencyCode: CurrencyCode;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const currency = getCurrencyOption(currencyCode);

  const pctX = parseNumericInput(session.pctX);
  const pctY = parseNumericInput(session.pctY);
  const pctOfRes =
    pctX !== null && pctY !== null ? calculatePercentOf(pctX, pctY) : null;

  const chFrom = parseNumericInput(session.changeFrom);
  const chTo = parseNumericInput(session.changeTo);
  const changeRes =
    chFrom !== null && chTo !== null
      ? calculatePercentChange(chFrom, chTo)
      : null;

  const price = parseNumericInput(session.origPrice);
  const discount = parseNumericInput(session.discountPct) ?? 0;
  const tax = parseNumericInput(session.taxPct) ?? 0;
  const discountRes =
    price !== null ? calculateDiscountAndTax(price, discount, tax) : null;

  return (
    <div>
      <WorkspaceHeader
        title="Percentage & Discount"
        subtitle="Compute percentage shares, growth or decline, and final checkout prices with tax/VAT."
        onReset={onReset}
      />

      <div className="mb-5">
        <SegmentedTabs
          value={session.tab}
          onChange={(tab) => onChange({ tab })}
          options={[
            { id: 'percentOf', label: 'X% of Y' },
            { id: 'change', label: '% Change' },
            { id: 'discount', label: 'Discount & Tax' },
          ]}
        />
      </div>

      {session.tab === 'percentOf' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput
              id="pct-x"
              label="Percentage"
              value={session.pctX}
              onChange={(pctX) => onChange({ pctX })}
              suffix="%"
              placeholder="15"
            />
            <FieldInput
              id="pct-y"
              label="Base Value"
              value={session.pctY}
              onChange={(pctY) => onChange({ pctY })}
              placeholder="240"
            />
          </div>

          {pctOfRes ? (
            <PrimaryResultCard
              label={`${pctX}% of ${pctY}`}
              value={formatNumber(pctOfRes.value)}
              formula={pctOfRes.formula}
              onSave={() =>
                onAddHistory(
                  `${pctX}% of ${pctY}`,
                  formatNumber(pctOfRes.value),
                )
              }
            />
          ) : (
            <InlineAlert tone="info">
              Enter valid numbers for both percentage and base value.
            </InlineAlert>
          )}
        </div>
      )}

      {session.tab === 'change' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput
              id="chg-from"
              label="Original Value (From)"
              value={session.changeFrom}
              onChange={(changeFrom) => onChange({ changeFrom })}
              placeholder="80"
            />
            <FieldInput
              id="chg-to"
              label="New Value (To)"
              value={session.changeTo}
              onChange={(changeTo) => onChange({ changeTo })}
              placeholder="100"
            />
          </div>

          {changeRes === null ? (
            <InlineAlert tone="info">
              Enter both original and new values to compute percentage change.
            </InlineAlert>
          ) : !changeRes.ok ? (
            <InlineAlert tone="error">{changeRes.error}</InlineAlert>
          ) : (
            <PrimaryResultCard
              label="Percentage Change"
              value={`${changeRes.percentChange > 0 ? '+' : ''}${formatNumber(changeRes.percentChange, { maxDecimals: 4 })}%`}
              subtext={`Net ${changeRes.direction}: ${changeRes.delta > 0 ? '+' : ''}${formatNumber(changeRes.delta)}`}
              formula={changeRes.formula}
              onSave={() =>
                onAddHistory(
                  `${chFrom} → ${chTo}`,
                  `${changeRes.percentChange > 0 ? '+' : ''}${formatNumber(changeRes.percentChange, { maxDecimals: 4 })}%`,
                )
              }
            />
          )}
        </div>
      )}

      {session.tab === 'discount' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldInput
              id="disc-price"
              label="Original Price"
              value={session.origPrice}
              onChange={(origPrice) => onChange({ origPrice })}
              prefix={currency.symbol.trim()}
              placeholder="120"
            />
            <FieldInput
              id="disc-pct"
              label="Discount"
              value={session.discountPct}
              onChange={(discountPct) => onChange({ discountPct })}
              suffix="%"
              placeholder="25"
            />
            <FieldInput
              id="disc-tax"
              label="Sales Tax / VAT"
              value={session.taxPct}
              onChange={(taxPct) => onChange({ taxPct })}
              suffix="%"
              placeholder="8"
            />
          </div>

          {discountRes ? (
            <>
              {discountRes.warnings.length > 0 && (
                <InlineAlert tone="warning">
                  {discountRes.warnings.join(' ')}
                </InlineAlert>
              )}
              <PrimaryResultCard
                label="Final Checkout Price"
                value={formatCurrency(
                  discountRes.finalPrice,
                  currency.symbol,
                  currency.decimals,
                )}
                subtext={`You save ${formatCurrency(discountRes.discountSavings, currency.symbol, currency.decimals)} before tax`}
                formula={discountRes.formula}
                onSave={() =>
                  onAddHistory(
                    `${formatCurrency(discountRes.originalPrice, currency.symbol, currency.decimals)} − ${discountRes.discountPercent}% + ${discountRes.taxPercent}% tax`,
                    formatCurrency(
                      discountRes.finalPrice,
                      currency.symbol,
                      currency.decimals,
                    ),
                  )
                }
              >
                <div className="grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#334155]">
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Savings
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#16A34A] dark:text-emerald-400">
                      −{formatCurrency(discountRes.discountSavings, currency.symbol, currency.decimals)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Discounted
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatCurrency(discountRes.priceAfterDiscount, currency.symbol, currency.decimals)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Tax / VAT
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      +{formatCurrency(discountRes.taxAmount, currency.symbol, currency.decimals)}
                    </div>
                  </div>
                </div>
              </PrimaryResultCard>
            </>
          ) : (
            <InlineAlert tone="info">
              Enter an original price to calculate savings and final price.
            </InlineAlert>
          )}
        </div>
      )}
    </div>
  );
}
