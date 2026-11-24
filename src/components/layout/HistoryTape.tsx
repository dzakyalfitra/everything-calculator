import { ArrowUpRight, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../../types/calculator.ts';
import { CopyButton } from '../shared/UiPrimitives.tsx';

function HistoryBody({
  entries,
  onRemove,
  onClear,
  onReload,
}: {
  entries: HistoryEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReload: (entry: HistoryEntry) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#334155]">
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-[#475569] uppercase dark:text-slate-400">
            History Tape
          </h2>
          <p className="text-[11px] text-[#475569] dark:text-slate-500">
            Stored locally ({entries.length}/50)
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="btn-tactile inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#475569] dark:text-slate-400">
          Completed calculations and saved snapshots appear here.
        </div>
      ) : (
        <ul className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="group rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 dark:border-[#334155] dark:bg-[#0F172A]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#475569] dark:text-slate-400">
                  {entry.modeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="rounded p-0.5 text-slate-400 opacity-70 hover:text-[#DC2626] hover:opacity-100"
                  aria-label="Delete history item"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="font-mono-tabular mt-1 truncate text-xs text-[#475569] dark:text-slate-400">
                {entry.summary}
              </div>
              <div className="font-mono-tabular mt-0.5 break-all text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {entry.result}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <CopyButton text={entry.result} label="Copy" size="xs" />
                <button
                  type="button"
                  onClick={() => onReload(entry)}
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2563EB] hover:underline dark:text-[#60A5FA]"
                >
                  <span>{entry.reloadExpression ? 'Load' : 'Open'}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HistoryTape({
  entries,
  onRemove,
  onClear,
  onReload,
  drawerOpen,
  onCloseDrawer,
}: {
  entries: HistoryEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReload: (entry: HistoryEntry) => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}) {
  return (
    <>
      {/* Desktop right rail */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white p-3.5 dark:border-[#334155] dark:bg-[#1E293B]">
          <HistoryBody
            entries={entries}
            onRemove={onRemove}
            onClear={onClear}
            onReload={onReload}
          />
        </div>
      </aside>

      {/* Tablet/mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseDrawer}
          />
          <div className="relative z-10 flex w-80 max-w-[88vw] flex-col border-l border-[#E2E8F0] bg-white p-4 shadow-xl dark:border-[#334155] dark:bg-[#1E293B]">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={onCloseDrawer}
                className="rounded-md p-1 text-[#475569] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close history tape"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <HistoryBody
                entries={entries}
                onRemove={onRemove}
                onClear={onClear}
                onReload={(entry) => {
                  onReload(entry);
                  onCloseDrawer();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
