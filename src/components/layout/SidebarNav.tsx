import { X } from 'lucide-react';
import {
  CALCULATOR_GROUPS,
  CALCULATOR_MODES,
  type CalculatorModeId,
} from '../../types/calculator.ts';

function NavList({
  activeMode,
  onSelectMode,
}: {
  activeMode: CalculatorModeId;
  onSelectMode: (id: CalculatorModeId) => void;
}) {
  return (
    <nav className="space-y-5" aria-label="Calculator workspaces">
      {CALCULATOR_GROUPS.map((group) => {
        const items = CALCULATOR_MODES.filter((m) => m.group === group.id);
        return (
          <div key={group.id}>
            <div className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {items.map((mode) => {
                const active = mode.id === activeMode;
                return (
                  <li key={mode.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMode(mode.id)}
                      className={`btn-tactile flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-[#2563EB]/10 font-semibold text-[#2563EB] dark:bg-[#3B82F6]/15 dark:text-[#60A5FA]'
                          : 'font-medium text-[#0F172A] hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate">{mode.shortLabel}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB] dark:bg-[#60A5FA]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarNav({
  activeMode,
  onSelectMode,
  mobileOpen,
  onCloseMobile,
}: {
  activeMode: CalculatorModeId;
  onSelectMode: (id: CalculatorModeId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 rounded-lg border border-[#E2E8F0] bg-white p-3 dark:border-[#334155] dark:bg-[#1E293B]">
          <NavList activeMode={activeMode} onSelectMode={onSelectMode} />
        </div>
      </aside>

      {/* Mobile / tablet compact horizontal bar */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {CALCULATOR_MODES.map((mode) => {
          const active = mode.id === activeMode;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`btn-tactile shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                active
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#3B82F6] dark:bg-[#3B82F6]'
                  : 'border-[#E2E8F0] bg-white text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300'
              }`}
            >
              {mode.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-[#E2E8F0] bg-white p-4 shadow-xl dark:border-[#334155] dark:bg-[#1E293B]">
            <div className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#334155]">
              <span className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                All Calculators
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-md p-1 text-[#475569] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close navigation drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <NavList
                activeMode={activeMode}
                onSelectMode={(id) => {
                  onSelectMode(id);
                  onCloseMobile();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
