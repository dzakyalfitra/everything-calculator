import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from '../types/calculator.ts';

const STORAGE_KEY_HISTORY = 'everything-calc:history';
const MAX_HISTORY_ENTRIES = 50;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function useHistoryTape() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(entries));
    } catch {
      // ignore storage quota issues
    }
  }, [entries]);

  const addEntry = useCallback(
    (item: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
      const next: HistoryEntry = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      setEntries((prev) => [next, ...prev].slice(0, MAX_HISTORY_ENTRIES));
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, removeEntry, clearHistory };
}
