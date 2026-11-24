import { useEffect, useState } from 'react';
import { TopHeader } from './components/layout/TopHeader.tsx';
import { SidebarNav } from './components/layout/SidebarNav.tsx';
import { HistoryTape } from './components/layout/HistoryTape.tsx';
import { ModeQuickJumpModal } from './components/layout/ModeQuickJumpModal.tsx';
import { StandardCalculator } from './components/calculators/StandardCalculator.tsx';
import { PercentageCalculator } from './components/calculators/PercentageCalculator.tsx';
import { TipSplitCalculator } from './components/calculators/TipSplitCalculator.tsx';
import { UnitConverterCalculator } from './components/calculators/UnitConverterCalculator.tsx';
import { DateCalculator } from './components/calculators/DateCalculator.tsx';
import { FinanceCalculator } from './components/calculators/FinanceCalculator.tsx';
import { CurrencyCalculator } from './components/calculators/CurrencyCalculator.tsx';
import { HealthCalculator } from './components/calculators/HealthCalculator.tsx';
import { StatisticsCalculator } from './components/calculators/StatisticsCalculator.tsx';
import { useAppPreferences } from './state/useAppPreferences.ts';
import { useHistoryTape } from './state/useHistoryTape.ts';
import { useSessionCache } from './state/useSessionCache.ts';
import { CALCULATOR_MODES, type HistoryEntry } from './types/calculator.ts';

export function App() {
  const {
    theme,
    toggleTheme,
    currencyCode,
    setCurrencyCode,
    unitSystem,
    setUnitSystem,
    activeMode,
    setActiveMode,
  } = useAppPreferences();

  const { entries, addEntry, removeEntry, clearHistory } = useHistoryTape();
  const { sessions, updateSession, resetSession } = useSessionCache();

  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Global shortcut: Cmd/Ctrl+K or '/' (when no input is focused)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickJumpOpen((o) => !o);
        return;
      }
      const target = e.target as HTMLElement | null;
      const isEditing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isEditing && e.key === '/' && activeMode !== 'standard') {
        e.preventDefault();
        setQuickJumpOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode]);

  const recordHistory = (
    mode: HistoryEntry['mode'],
    summary: string,
    result: string,
    reloadExpression?: string,
  ) => {
    const meta = CALCULATOR_MODES.find((m) => m.id === mode);
    addEntry({
      mode,
      modeLabel: meta?.shortLabel ?? mode,
      summary,
      result,
      reloadExpression,
    });
  };

  const handleReloadHistory = (entry: HistoryEntry) => {
    setActiveMode(entry.mode);
    if (entry.mode === 'standard' && entry.reloadExpression) {
      updateSession('standard', {
        expression: entry.reloadExpression,
        displayResult: entry.result,
        error: null,
        justEvaluated: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <TopHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        currencyCode={currencyCode}
        onChangeCurrency={setCurrencyCode}
        onOpenQuickJump={() => setQuickJumpOpen(true)}
        onToggleSidebarMobile={() => setMobileMenuOpen(true)}
        onToggleHistoryDrawer={() => setHistoryDrawerOpen(true)}
        historyCount={entries.length}
      />

      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <SidebarNav
            activeMode={activeMode}
            onSelectMode={setActiveMode}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          <main className="min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white p-4 sm:p-6 dark:border-[#334155] dark:bg-[#1E293B]">
            {activeMode === 'standard' && (
              <StandardCalculator
                session={sessions.standard}
                onChange={(u) => updateSession('standard', u)}
                onReset={() => resetSession('standard')}
                onAddHistory={(summary, result, expr) =>
                  recordHistory('standard', summary, result, expr)
                }
                keyboardEnabled={
                  !quickJumpOpen && !mobileMenuOpen && !historyDrawerOpen
                }
              />
            )}

            {activeMode === 'percentage' && (
              <PercentageCalculator
                session={sessions.percentage}
                onChange={(u) => updateSession('percentage', u)}
                onReset={() => resetSession('percentage')}
                currencyCode={currencyCode}
                onAddHistory={(summary, result) =>
                  recordHistory('percentage', summary, result)
                }
              />
            )}

            {activeMode === 'tip' && (
              <TipSplitCalculator
                session={sessions.tip}
                onChange={(u) => updateSession('tip', u)}
                onReset={() => resetSession('tip')}
                currencyCode={currencyCode}
                onAddHistory={(summary, result) =>
                  recordHistory('tip', summary, result)
                }
              />
            )}

            {activeMode === 'unit' && (
              <UnitConverterCalculator
                session={sessions.unit}
                onChange={(u) => updateSession('unit', u)}
                onReset={() => resetSession('unit')}
                onAddHistory={(summary, result) =>
                  recordHistory('unit', summary, result)
                }
              />
            )}

            {activeMode === 'date' && (
              <DateCalculator
                session={sessions.date}
                onChange={(u) => updateSession('date', u)}
                onReset={() => resetSession('date')}
                onAddHistory={(summary, result) =>
                  recordHistory('date', summary, result)
                }
              />
            )}

            {activeMode === 'finance' && (
              <FinanceCalculator
                session={sessions.finance}
                onChange={(u) => updateSession('finance', u)}
                onReset={() => resetSession('finance')}
                currencyCode={currencyCode}
                onAddHistory={(summary, result) =>
                  recordHistory('finance', summary, result)
                }
              />
            )}

            {activeMode === 'currency' && (
              <CurrencyCalculator
                session={sessions.currency}
                onChange={(u) => updateSession('currency', u)}
                onReset={() => resetSession('currency')}
                onAddHistory={(summary, result) =>
                  recordHistory('currency', summary, result)
                }
              />
            )}

            {activeMode === 'health' && (
              <HealthCalculator
                session={sessions.health}
                onChange={(u) => updateSession('health', u)}
                onReset={() => resetSession('health')}
                unitSystem={unitSystem}
                onChangeUnitSystem={setUnitSystem}
                onAddHistory={(summary, result) =>
                  recordHistory('health', summary, result)
                }
              />
            )}

            {activeMode === 'statistics' && (
              <StatisticsCalculator
                session={sessions.statistics}
                onChange={(u) => updateSession('statistics', u)}
                onReset={() => resetSession('statistics')}
                onAddHistory={(summary, result) =>
                  recordHistory('statistics', summary, result)
                }
              />
            )}
          </main>

          <HistoryTape
            entries={entries}
            onRemove={removeEntry}
            onClear={clearHistory}
            onReload={handleReloadHistory}
            drawerOpen={historyDrawerOpen}
            onCloseDrawer={() => setHistoryDrawerOpen(false)}
          />
        </div>
      </div>

      <ModeQuickJumpModal
        open={quickJumpOpen}
        onClose={() => setQuickJumpOpen(false)}
        onSelect={setActiveMode}
      />
    </div>
  );
}

export default App;
