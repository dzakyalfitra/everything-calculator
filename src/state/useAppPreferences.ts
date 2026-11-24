import { useEffect, useState } from 'react';
import type { CurrencyCode } from '../engine/formatter.ts';
import type { HealthUnitSystem } from '../engine/health.ts';
import type { CalculatorModeId } from '../types/calculator.ts';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY_THEME = 'everything-calc:theme';
const STORAGE_KEY_CURRENCY = 'everything-calc:currency';
const STORAGE_KEY_UNIT_SYSTEM = 'everything-calc:unit-system';
const STORAGE_KEY_LAST_MODE = 'everything-calc:last-mode';

function readStorage<T extends string>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return (val as T) || fallback;
  } catch {
    return fallback;
  }
}

export function useAppPreferences() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    readStorage<ThemeMode>(STORAGE_KEY_THEME, 'light'),
  );
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() =>
    readStorage<CurrencyCode>(STORAGE_KEY_CURRENCY, 'USD'),
  );
  const [unitSystem, setUnitSystem] = useState<HealthUnitSystem>(() =>
    readStorage<HealthUnitSystem>(STORAGE_KEY_UNIT_SYSTEM, 'metric'),
  );
  const [activeMode, setActiveMode] = useState<CalculatorModeId>(() =>
    readStorage<CalculatorModeId>(STORAGE_KEY_LAST_MODE, 'standard'),
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, currencyCode);
    } catch {
      // ignore
    }
  }, [currencyCode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIT_SYSTEM, unitSystem);
    } catch {
      // ignore
    }
  }, [unitSystem]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_MODE, activeMode);
    } catch {
      // ignore
    }
  }, [activeMode]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return {
    theme,
    toggleTheme,
    currencyCode,
    setCurrencyCode,
    unitSystem,
    setUnitSystem,
    activeMode,
    setActiveMode,
  };
}
