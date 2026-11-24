import { Calculator, History, Menu, Moon, Search, Sun } from 'lucide-react';
import {
  GLOBAL_CURRENCIES,
  type CurrencyCode,
} from '../../engine/formatter.ts';
import type { ThemeMode } from '../../state/useAppPreferences.ts';

export function TopHeader({
  theme,
  onToggleTheme,
  currencyCode,
  onChangeCurrency,
  onOpenQuickJump,
  onToggleSidebarMobile,
  onToggleHistoryDrawer,
  historyCount,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  currencyCode: CurrencyCode;
  onChangeCurrency: (code: CurrencyCode) => void;
  onOpenQuickJump: () => void;
  onToggleSidebarMobile: () => void;
  onToggleHistoryDrawer: () => void;
  historyCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xs dark:border-[#334155] dark:bg-[#1E293B]/95">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="btn-tactile inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] lg:hidden dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
            aria-label="Open calculator menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563EB] text-white dark:bg-[#3B82F6]">
              <Calculator className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-sm font-bold tracking-tight text-[#0F172A] sm:text-base dark:text-[#F1F5F9]">
                Everything Calculator
              </h1>
              <p className="hidden text-[11px] text-[#475569] sm:block dark:text-slate-400">
                100% client-side precision utility
              </p>
            </div>
          </div>
        </div>

        {/* Quick jump trigger */}
        <button
          type="button"
          onClick={onOpenQuickJump}
          className="btn-tactile hidden max-w-sm flex-1 items-center justify-between rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-left text-xs text-[#475569] hover:border-slate-300 sm:flex dark:border-[#334155] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:border-slate-500"
        >
          <span className="inline-flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Jump to calculator mode...</span>
          </span>
          <kbd className="font-mono-tabular rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-400">
            / or ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickJump}
            className="btn-tactile inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] sm:hidden dark:border-[#334155] dark:bg-[#0F172A] dark:text-slate-300"
            aria-label="Search calculator modes"
          >
            <Search className="h-4 w-4" />
          </button>

          <label className="sr-only" htmlFor="global-currency-select">
            Display Currency
          </label>
          <select
            id="global-currency-select"
            value={currencyCode}
            onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
            className="font-mono-tabular h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
            title="Global display currency symbol"
          >
            {GLOBAL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onToggleHistoryDrawer}
            className="btn-tactile inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-medium text-[#0F172A] lg:hidden dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
            aria-label="Toggle history tape"
          >
            <History className="h-4 w-4 text-[#475569] dark:text-slate-400" />
            <span className="font-mono-tabular">{historyCount}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-tactile inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-slate-100 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9] dark:hover:bg-slate-800"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
