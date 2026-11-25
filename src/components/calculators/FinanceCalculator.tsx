import { useState } from 'react';
import {
  formatCurrency,
  formatNumber,
  getCurrencyOption,
  parseNumericInput,
  type CurrencyCode,
} from '../../engine/formatter.ts';
import {
  calculateCompoundInterest,
  calculateLoan,
  calculateSimpleInterest,
  type CompoundingFrequency,
} from '../../engine/finance.ts';
import {
  buildCompoundSeries,
  buildLoanSeries,
} from '../../engine/chartGeometry.ts';
import type { FinanceSession } from '../../state/useSessionCache.ts';
import {
  CompoundGrowthChart,
  LoanAmortizationChart,
} from '../shared/Charts.tsx';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  SegmentedTabs,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

export function FinanceCalculator({
  session,
  onChange,
  onReset,
  currencyCode,
  onAddHistory,
}: {
  session: FinanceSession;
  onChange: (updater: Partial<FinanceSession>) => void;
  onReset: () => void;
  currencyCode: CurrencyCode;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const currency = getCurrencyOption(currencyCode);
  const [showSchedule, setShowSchedule] = useState(false);

  const loanP = parseNumericInput(session.loanPrincipal);
  const loanR = parseNumericInput(session.loanRate);
  const loanT = parseNumericInput(session.loanTerm);
  const loanRes =
    loanP !== null && loanR !== null && loanT !== null
      ? calculateLoan({
          principal: loanP,
          annualRatePercent: loanR,
          termValue: loanT,
          termUnit: session.loanTermUnit,
        })
      : null;

  const compP = parseNumericInput(session.compPrincipal);
  const compM = parseNumericInput(session.compMonthly) ?? 0;
  const compR = parseNumericInput(session.compRate);
  const compY = parseNumericInput(session.compYears);
  const compRes =
    compP !== null && compR !== null && compY !== null
      ? calculateCompoundInterest({
          initialPrincipal: compP,
          monthlyContribution: compM,
          annualRatePercent: compR,
          years: compY,
          compounding: session.compFreq,
        })
      : null;

  const simpP = parseNumericInput(session.simpPrincipal);
  const simpR = parseNumericInput(session.simpRate);
  const simpT = parseNumericInput(session.simpTime);
  const simpRes =
    simpP !== null && simpR !== null && simpT !== null
      ? calculateSimpleInterest({
          principal: simpP,
          annualRatePercent: simpR,
          timeValue: simpT,
          timeUnit: session.simpTimeUnit,
        })
      : null;

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Loan, Compound & Simple Interest"
        subtitle="Amortized loan payments, compound investment growth, and short-term simple interest."
        onReset={onReset}
      />

      <SegmentedTabs
        value={session.tab}
        onChange={(tab) => onChange({ tab })}
        options={[
          { id: 'loan', label: 'Loan / Mortgage' },
          { id: 'compound', label: 'Compound Interest' },
          { id: 'simple', label: 'Simple Interest' },
        ]}
      />

      {session.tab === 'loan' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldInput
              id="loan-principal"
              label="Loan Principal"
              value={session.loanPrincipal}
              onChange={(loanPrincipal) => onChange({ loanPrincipal })}
              prefix={currency.symbol.trim()}
            />
            <FieldInput
              id="loan-rate"
              label="Annual Rate (APR)"
              value={session.loanRate}
              onChange={(loanRate) => onChange({ loanRate })}
              suffix="%"
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="loan-term"
                  className="text-xs font-medium text-[#475569] dark:text-slate-300"
                >
                  Loan Term
                </label>
                <div className="flex gap-1 text-[11px]">
                  {(['years', 'months'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onChange({ loanTermUnit: unit })}
                      className={`rounded px-1.5 py-0.5 font-medium ${
                        session.loanTermUnit === unit
                          ? 'bg-[#2563EB] text-white dark:bg-[#3B82F6]'
                          : 'text-[#475569] hover:text-[#0F172A] dark:text-slate-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="loan-term"
                type="text"
                inputMode="decimal"
                value={session.loanTerm}
                onChange={(e) => onChange({ loanTerm: e.target.value })}
                className="font-mono-tabular h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>
          </div>

          {loanRes === null ? (
            <InlineAlert tone="info">
              Enter loan principal, APR, and term to calculate payments.
            </InlineAlert>
          ) : !loanRes.ok ? (
            <InlineAlert tone="error">{loanRes.error}</InlineAlert>
          ) : (
            <>
              <PrimaryResultCard
                label="Monthly Payment"
                value={`${formatCurrency(loanRes.monthlyPayment, currency.symbol, currency.decimals)} / mo`}
                copyValue={formatCurrency(loanRes.monthlyPayment, currency.symbol, currency.decimals)}
                subtext={`Total Interest: ${formatCurrency(loanRes.totalInterest, currency.symbol, currency.decimals)} over ${loanRes.totalMonths} months`}
                formula={loanRes.formula}
                onSave={() =>
                  onAddHistory(
                    `Loan ${formatCurrency(loanP ?? 0, currency.symbol, 0)} @ ${loanR}% (${loanRes.totalMonths}m)`,
                    `${formatCurrency(loanRes.monthlyPayment, currency.symbol, currency.decimals)}/mo`,
                  )
                }
              >
                <div className="space-y-3 border-t border-[#E2E8F0] pt-3 dark:border-[#334155]">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[#475569] dark:text-slate-400">
                        Principal ({loanRes.principalPercent.toFixed(1)}%)
                      </span>
                      <span className="text-[#475569] dark:text-slate-400">
                        Interest ({loanRes.interestPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="bg-[#2563EB] dark:bg-[#3B82F6]"
                        style={{ width: `${loanRes.principalPercent}%` }}
                      />
                      <div
                        className="bg-[#D97706]"
                        style={{ width: `${loanRes.interestPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <div className="text-[#475569] dark:text-slate-400">
                        Principal
                      </div>
                      <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {formatCurrency(loanP ?? 0, currency.symbol, currency.decimals)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#475569] dark:text-slate-400">
                        Total Interest
                      </div>
                      <div className="font-mono-tabular mt-0.5 font-semibold text-[#D97706]">
                        {formatCurrency(loanRes.totalInterest, currency.symbol, currency.decimals)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#475569] dark:text-slate-400">
                        Total Paid
                      </div>
                      <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {formatCurrency(loanRes.totalPayment, currency.symbol, currency.decimals)}
                      </div>
                    </div>
                  </div>
                </div>
              </PrimaryResultCard>

              <LoanAmortizationChart
                series={buildLoanSeries(loanP ?? 0, loanRes.yearlySchedule)}
                currencySymbol={currency.symbol}
                currencyDecimals={currency.decimals}
              />

              <div>
                <button
                  type="button"
                  onClick={() => setShowSchedule((s) => !s)}
                  className="text-xs font-medium text-[#2563EB] hover:underline dark:text-[#60A5FA]"
                >
                  {showSchedule
                    ? 'Hide Yearly Amortization Schedule'
                    : `View Yearly Amortization Schedule (${loanRes.yearlySchedule.length} years)`}
                </button>
                {showSchedule && (
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-[#E2E8F0] dark:border-[#334155]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-[#F8FAFC] text-[#475569] dark:bg-[#0F172A] dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Year</th>
                          <th className="px-3 py-2 font-medium">Principal</th>
                          <th className="px-3 py-2 font-medium">Interest</th>
                          <th className="px-3 py-2 font-medium">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono-tabular divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                        {loanRes.yearlySchedule.map((row) => (
                          <tr key={row.year}>
                            <td className="px-3 py-1.5">{row.year}</td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(row.principalPaid, currency.symbol, currency.decimals)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(row.interestPaid, currency.symbol, currency.decimals)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(row.endingBalance, currency.symbol, currency.decimals)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {session.tab === 'compound' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldInput
              id="comp-principal"
              label="Initial Principal"
              value={session.compPrincipal}
              onChange={(compPrincipal) => onChange({ compPrincipal })}
              prefix={currency.symbol.trim()}
            />
            <FieldInput
              id="comp-monthly"
              label="Monthly Contribution"
              value={session.compMonthly}
              onChange={(compMonthly) => onChange({ compMonthly })}
              prefix={currency.symbol.trim()}
            />
            <FieldInput
              id="comp-rate"
              label="Annual Rate"
              value={session.compRate}
              onChange={(compRate) => onChange({ compRate })}
              suffix="%"
            />
            <FieldInput
              id="comp-years"
              label="Duration"
              value={session.compYears}
              onChange={(compYears) => onChange({ compYears })}
              suffix="yr"
            />
            <div>
              <label
                htmlFor="comp-freq"
                className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Compounding Frequency
              </label>
              <select
                id="comp-freq"
                value={session.compFreq}
                onChange={(e) =>
                  onChange({ compFreq: e.target.value as CompoundingFrequency })
                }
                className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              >
                <option value="daily">Daily (365/yr)</option>
                <option value="monthly">Monthly (12/yr)</option>
                <option value="quarterly">Quarterly (4/yr)</option>
                <option value="semiannually">Semi-annually (2/yr)</option>
                <option value="annually">Annually (1/yr)</option>
              </select>
            </div>
          </div>

          {compRes === null ? (
            <InlineAlert tone="info">
              Enter initial principal, rate, and years to project growth.
            </InlineAlert>
          ) : !compRes.ok ? (
            <InlineAlert tone="error">{compRes.error}</InlineAlert>
          ) : (
            <>
            <PrimaryResultCard
              label={`Projected Balance (${compY} years)`}
              value={formatCurrency(compRes.futureValue, currency.symbol, currency.decimals)}
              subtext={`Effective APY: ${formatNumber(compRes.effectiveAnnualRate, { maxDecimals: 2 })}%`}
              formula={compRes.formula}
              onSave={() =>
                onAddHistory(
                  `Compound ${formatCurrency(compP ?? 0, currency.symbol, 0)} + ${formatCurrency(compM, currency.symbol, 0)}/mo @ ${compR}% (${compY}y)`,
                  formatCurrency(compRes.futureValue, currency.symbol, currency.decimals),
                )
              }
            >
              <div className="space-y-3 border-t border-[#E2E8F0] pt-3 dark:border-[#334155]">
                {compRes.futureValue > 0 && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-[#475569] dark:text-slate-400">
                      <span>
                        Contributions (
                        {((compRes.totalContributions / compRes.futureValue) * 100).toFixed(1)}%)
                      </span>
                      <span>
                        Interest Earned (
                        {((compRes.totalInterest / compRes.futureValue) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="bg-[#2563EB] dark:bg-[#3B82F6]"
                        style={{
                          width: `${(compRes.totalContributions / compRes.futureValue) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-[#16A34A]"
                        style={{
                          width: `${(compRes.totalInterest / compRes.futureValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Total Contributed
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatCurrency(compRes.totalContributions, currency.symbol, currency.decimals)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#475569] dark:text-slate-400">
                      Total Interest Earned
                    </div>
                    <div className="font-mono-tabular mt-0.5 font-semibold text-[#16A34A] dark:text-emerald-400">
                      {formatCurrency(compRes.totalInterest, currency.symbol, currency.decimals)}
                    </div>
                  </div>
                </div>
              </div>
            </PrimaryResultCard>

            <CompoundGrowthChart
              series={buildCompoundSeries(compP ?? 0, compRes.yearlyGrowth)}
              currencySymbol={currency.symbol}
              currencyDecimals={currency.decimals}
            />
          </>
          )}
        </div>
      )}

      {session.tab === 'simple' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldInput
              id="simp-principal"
              label="Principal"
              value={session.simpPrincipal}
              onChange={(simpPrincipal) => onChange({ simpPrincipal })}
              prefix={currency.symbol.trim()}
            />
            <FieldInput
              id="simp-rate"
              label="Annual Rate"
              value={session.simpRate}
              onChange={(simpRate) => onChange({ simpRate })}
              suffix="%"
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="simp-time"
                  className="text-xs font-medium text-[#475569] dark:text-slate-300"
                >
                  Duration
                </label>
                <div className="flex gap-1 text-[11px]">
                  {(['years', 'months', 'days'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onChange({ simpTimeUnit: unit })}
                      className={`rounded px-1.5 py-0.5 font-medium ${
                        session.simpTimeUnit === unit
                          ? 'bg-[#2563EB] text-white dark:bg-[#3B82F6]'
                          : 'text-[#475569] hover:text-[#0F172A] dark:text-slate-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="simp-time"
                type="text"
                inputMode="decimal"
                value={session.simpTime}
                onChange={(e) => onChange({ simpTime: e.target.value })}
                className="font-mono-tabular h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>
          </div>

          {simpRes === null ? (
            <InlineAlert tone="info">
              Enter principal, annual rate, and duration.
            </InlineAlert>
          ) : !simpRes.ok ? (
            <InlineAlert tone="error">{simpRes.error}</InlineAlert>
          ) : (
            <PrimaryResultCard
              label="Total Balance (Principal + Simple Interest)"
              value={formatCurrency(simpRes.totalAmount, currency.symbol, currency.decimals)}
              subtext={`Simple Interest: ${formatCurrency(simpRes.interest, currency.symbol, currency.decimals)} (${simpRes.yearsEquivalent} yrs)`}
              formula={simpRes.formula}
              onSave={() =>
                onAddHistory(
                  `Simple ${formatCurrency(simpP ?? 0, currency.symbol, 0)} @ ${simpR}% (${simpT} ${session.simpTimeUnit})`,
                  formatCurrency(simpRes.totalAmount, currency.symbol, currency.decimals),
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
