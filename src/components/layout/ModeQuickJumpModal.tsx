import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  CALCULATOR_MODES,
  type CalculatorModeId,
} from '../../types/calculator.ts';

export function ModeQuickJumpModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: CalculatorModeId) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CALCULATOR_MODES;
    return CALCULATOR_MODES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.groupLabel.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.keywords.some((kw) => kw.includes(q)),
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24">
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to calculator mode"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]"
      >
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-3.5 py-2.5 dark:border-[#334155]">
          <Search className="h-4 w-4 text-[#475569] dark:text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) =>
                  matches.length ? (i + 1) % matches.length : 0,
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) =>
                  matches.length
                    ? (i - 1 + matches.length) % matches.length
                    : 0,
                );
              } else if (e.key === 'Enter' && matches[selectedIndex]) {
                e.preventDefault();
                onSelect(matches[selectedIndex].id);
                onClose();
              }
            }}
            placeholder="Search calculators (e.g. mortgage, bmi, unit, stats)..."
            className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-slate-400 dark:text-[#F1F5F9]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#475569] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="max-h-80 overflow-y-auto p-1.5">
          {matches.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-[#475569] dark:text-slate-400">
              No matching calculator workspace found.
            </li>
          ) : (
            matches.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left ${
                      active
                        ? 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]'
                        : 'text-[#0F172A] dark:text-[#F1F5F9]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-xs text-[#475569] dark:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#475569] uppercase ring-1 ring-[#E2E8F0] dark:bg-[#0F172A] dark:text-slate-400 dark:ring-[#334155]">
                      {item.groupLabel}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
