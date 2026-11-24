import { useCallback, useEffect, useMemo } from 'react';
import { Delete } from 'lucide-react';
import { evaluateExpression } from '../../engine/expressionParser.ts';
import { formatNumber } from '../../engine/formatter.ts';
import type { StandardSession } from '../../state/useSessionCache.ts';
import {
  CopyButton,
  InlineAlert,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

interface StandardCalculatorProps {
  session: StandardSession;
  onChange: (
    updater:
      | Partial<StandardSession>
      | ((prev: StandardSession) => StandardSession),
  ) => void;
  onReset: () => void;
  onAddHistory: (summary: string, result: string, reloadExpr: string) => void;
  keyboardEnabled: boolean;
}

const BINARY_OPS = new Set(['+', '−', '×', '÷', '^', '-', '*', '/']);

export function StandardCalculator({
  session,
  onChange,
  onReset,
  onAddHistory,
  keyboardEnabled,
}: StandardCalculatorProps) {
  const liveEval = useMemo(() => {
    if (!session.expression.trim()) return null;
    return evaluateExpression(session.expression, session.angleUnit);
  }, [session.expression, session.angleUnit]);

  const appendToken = useCallback(
    (token: string) => {
      onChange((prev) => {
        const isOp = BINARY_OPS.has(token);
        let base = prev.expression;

        if (prev.justEvaluated) {
          if (isOp || token === '%' || token === '!') {
            base = prev.displayResult === 'Error' ? '0' : prev.displayResult;
          } else {
            base = '';
          }
        }

        // Prevent repeated decimal points in the same number token
        if (token === '.') {
          const lastNum = base.split(/[+\-−×*/÷^()\s]/).pop() ?? '';
          if (lastNum.includes('.')) {
            return { ...prev, error: null };
          }
          if (lastNum === '') {
            base += '0';
          }
        }

        // Replace trailing binary operator if another binary operator is pressed
        const trimmed = base.trimEnd();
        const lastChar = trimmed.slice(-1);
        if (isOp && trimmed.length > 0 && BINARY_OPS.has(lastChar)) {
          base = trimmed.slice(0, -1);
        }

        const spaced =
          isOp && base.length > 0 && !base.endsWith(' ') && !base.endsWith('(')
            ? `${base} ${token} `
            : isOp && base.endsWith('(') && token === '−'
              ? `${base}-`
              : base + token;

        return {
          ...prev,
          expression: spaced,
          error: null,
          justEvaluated: false,
        };
      });
    },
    [onChange],
  );

  const handleEvaluate = useCallback(() => {
    const expr = session.expression.trim();
    if (!expr) return;
    const res = evaluateExpression(expr, session.angleUnit);
    if (res.ok) {
      const formatted = formatNumber(res.value, { maxDecimals: 10 });
      onChange({
        displayResult: formatted,
        error: null,
        justEvaluated: true,
      });
      onAddHistory(expr, formatted, expr);
    } else {
      onChange({
        error: res.error,
        justEvaluated: false,
      });
    }
  }, [session.expression, session.angleUnit, onChange, onAddHistory]);

  const handleBackspace = useCallback(() => {
    onChange((prev) => {
      if (prev.justEvaluated) {
        return { ...prev, expression: '', displayResult: '0', error: null, justEvaluated: false };
      }
      const trimmed = prev.expression.endsWith(' ')
        ? prev.expression.slice(0, -3)
        : prev.expression.slice(0, -1);
      return { ...prev, expression: trimmed, error: null };
    });
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange({
      expression: '',
      displayResult: '0',
      error: null,
      justEvaluated: false,
    });
  }, [onChange]);

  const handleNegate = useCallback(() => {
    onChange((prev) => {
      const expr = prev.expression.trim();
      if (!expr) return { ...prev, expression: '-', justEvaluated: false };
      if (prev.justEvaluated && prev.displayResult !== 'Error') {
        const next = prev.displayResult.startsWith('-')
          ? prev.displayResult.slice(1)
          : `-${prev.displayResult}`;
        return {
          ...prev,
          expression: next,
          displayResult: next,
          justEvaluated: false,
        };
      }
      return {
        ...prev,
        expression: expr.startsWith('-(') && expr.endsWith(')')
          ? expr.slice(2, -1)
          : `-(${expr})`,
        justEvaluated: false,
      };
    });
  }, [onChange]);

  const handleReciprocal = useCallback(() => {
    const expr = session.justEvaluated
      ? session.displayResult
      : session.expression.trim() || session.displayResult;
    const wrapped = `1 / (${expr})`;
    const res = evaluateExpression(wrapped, session.angleUnit);
    if (res.ok) {
      const formatted = formatNumber(res.value, { maxDecimals: 10 });
      onChange({
        expression: wrapped,
        displayResult: formatted,
        error: null,
        justEvaluated: true,
      });
      onAddHistory(wrapped, formatted, wrapped);
    } else {
      onChange({ error: res.error });
    }
  }, [session, onChange, onAddHistory]);

  const handleMemory = (action: 'MC' | 'MR' | 'M+' | 'M-') => {
    if (action === 'MC') {
      onChange({ memory: 0, hasMemory: false });
      return;
    }
    if (action === 'MR') {
      if (!session.hasMemory) return;
      appendToken(String(session.memory));
      return;
    }
    const current = liveEval?.ok
      ? liveEval.value
      : Number(session.displayResult.replace(/,/g, ''));
    if (!Number.isFinite(current)) return;
    onChange((prev) => ({
      ...prev,
      memory: action === 'M+' ? prev.memory + current : prev.memory - current,
      hasMemory: true,
    }));
  };

  useEffect(() => {
    if (!keyboardEnabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        appendToken(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendToken('.');
      } else if (e.key === '+') {
        e.preventDefault();
        appendToken('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendToken('−');
      } else if (e.key === '*') {
        e.preventDefault();
        appendToken('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendToken('÷');
      } else if (e.key === '^') {
        e.preventDefault();
        appendToken('^');
      } else if (e.key === '(' || e.key === ')' || e.key === '%' || e.key === '!') {
        e.preventDefault();
        appendToken(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardEnabled, appendToken, handleEvaluate, handleBackspace, handleClear]);

  const previewText =
    liveEval?.ok && !session.justEvaluated
      ? `= ${formatNumber(liveEval.value, { maxDecimals: 10 })}`
      : null;

  const shownValue = session.justEvaluated
    ? session.displayResult
    : liveEval?.ok
      ? formatNumber(liveEval.value, { maxDecimals: 10 })
      : session.displayResult;

  const keyBase =
    'btn-tactile font-mono-tabular flex h-12 items-center justify-center rounded-md border text-base font-medium select-none';
  const numKey = `${keyBase} border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9] dark:hover:bg-slate-800`;
  const opKey = `${keyBase} border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-slate-100 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-slate-700`;
  const sciKey =
    'btn-tactile font-mono-tabular flex h-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] hover:bg-slate-100 dark:border-[#334155] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <div>
      <WorkspaceHeader
        title="Standard & Scientific"
        subtitle="Keyboard-ready expression engine with parentheses, memory, and scientific functions."
        onReset={onReset}
        rightSlot={
          <div className="flex items-center gap-1.5">
            {session.scientificOpen && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    angleUnit: session.angleUnit === 'deg' ? 'rad' : 'deg',
                  })
                }
                className="btn-tactile font-mono-tabular rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] uppercase dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
                title="Toggle Degrees / Radians"
              >
                {session.angleUnit}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onChange({ scientificOpen: !session.scientificOpen })
              }
              className={`btn-tactile rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                session.scientificOpen
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] dark:border-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]'
                  : 'border-[#E2E8F0] bg-white text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300'
              }`}
            >
              {session.scientificOpen ? 'Hide Scientific' : 'Scientific'}
            </button>
          </div>
        }
      />

      {/* Readout */}
      <div className="mb-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#334155] dark:bg-[#0F172A]">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
            {session.hasMemory && (
              <span className="font-mono-tabular rounded bg-[#2563EB]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#2563EB] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]">
                M = {formatNumber(session.memory, { maxDecimals: 6 })}
              </span>
            )}
            <span>{session.scientificOpen ? `${session.angleUnit.toUpperCase()} mode` : 'Standard mode'}</span>
          </div>
          <CopyButton text={shownValue} label="Copy" size="xs" />
        </div>

        <input
          type="text"
          value={session.expression}
          onChange={(e) =>
            onChange({
              expression: e.target.value,
              error: null,
              justEvaluated: false,
            })
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleEvaluate();
            }
          }}
          placeholder="0"
          aria-label="Calculator expression input"
          className="font-mono-tabular w-full bg-transparent text-right text-sm text-[#475569] outline-none sm:text-base dark:text-slate-400"
        />

        <div className="font-mono-tabular mt-1 min-h-[2.75rem] break-all text-right text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl dark:text-[#F1F5F9]">
          {shownValue}
        </div>
        {previewText && (
          <div className="font-mono-tabular mt-0.5 text-right text-xs text-[#475569] dark:text-slate-400">
            Live preview {previewText}
          </div>
        )}
      </div>

      {session.error && (
        <div className="mb-4">
          <InlineAlert tone="error">{session.error}</InlineAlert>
        </div>
      )}

      {/* Memory row */}
      <div className="mb-2.5 grid grid-cols-4 gap-2">
        {(['MC', 'MR', 'M+', 'M-'] as const).map((mem) => (
          <button
            key={mem}
            type="button"
            disabled={mem === 'MR' && !session.hasMemory}
            onClick={() => handleMemory(mem)}
            className="btn-tactile font-mono-tabular h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569] hover:text-[#0F172A] disabled:opacity-40 dark:border-[#334155] dark:bg-[#0F172A] dark:text-slate-300 dark:hover:text-white"
          >
            {mem}
          </button>
        ))}
      </div>

      {/* Scientific expansion row */}
      {session.scientificOpen && (
        <div className="mb-2.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button type="button" onClick={() => appendToken('sin(')} className={sciKey}>sin</button>
          <button type="button" onClick={() => appendToken('cos(')} className={sciKey}>cos</button>
          <button type="button" onClick={() => appendToken('tan(')} className={sciKey}>tan</button>
          <button type="button" onClick={() => appendToken('log(')} className={sciKey}>log</button>
          <button type="button" onClick={() => appendToken('ln(')} className={sciKey}>ln</button>
          <button type="button" onClick={() => appendToken('√(')} className={sciKey}>√</button>
          <button type="button" onClick={() => appendToken('^')} className={sciKey}>xʸ</button>
          <button type="button" onClick={() => appendToken('!')} className={sciKey}>n!</button>
          <button type="button" onClick={() => appendToken('π')} className={sciKey}>π</button>
          <button type="button" onClick={() => appendToken('e')} className={sciKey}>e</button>
          <button type="button" onClick={() => appendToken('(')} className={sciKey}>(</button>
          <button type="button" onClick={() => appendToken(')')} className={sciKey}>)</button>
        </div>
      )}

      {/* Main Keypad */}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={handleClear} className={`${opKey} text-[#DC2626] dark:text-red-400`}>
          C
        </button>
        <button type="button" onClick={() => appendToken('(')} className={opKey}>
          (
        </button>
        <button type="button" onClick={() => appendToken(')')} className={opKey}>
          )
        </button>
        <button type="button" onClick={handleBackspace} className={opKey} aria-label="Backspace">
          <Delete className="h-4 w-4" />
        </button>

        <button type="button" onClick={handleReciprocal} className={opKey}>
          1/x
        </button>
        <button type="button" onClick={() => appendToken('√(')} className={opKey}>
          √x
        </button>
        <button type="button" onClick={() => appendToken('%')} className={opKey}>
          %
        </button>
        <button type="button" onClick={() => appendToken('÷')} className={opKey}>
          ÷
        </button>

        <button type="button" onClick={() => appendToken('7')} className={numKey}>7</button>
        <button type="button" onClick={() => appendToken('8')} className={numKey}>8</button>
        <button type="button" onClick={() => appendToken('9')} className={numKey}>9</button>
        <button type="button" onClick={() => appendToken('×')} className={opKey}>×</button>

        <button type="button" onClick={() => appendToken('4')} className={numKey}>4</button>
        <button type="button" onClick={() => appendToken('5')} className={numKey}>5</button>
        <button type="button" onClick={() => appendToken('6')} className={numKey}>6</button>
        <button type="button" onClick={() => appendToken('−')} className={opKey}>−</button>

        <button type="button" onClick={() => appendToken('1')} className={numKey}>1</button>
        <button type="button" onClick={() => appendToken('2')} className={numKey}>2</button>
        <button type="button" onClick={() => appendToken('3')} className={numKey}>3</button>
        <button type="button" onClick={() => appendToken('+')} className={opKey}>+</button>

        <button type="button" onClick={handleNegate} className={numKey}>±</button>
        <button type="button" onClick={() => appendToken('0')} className={numKey}>0</button>
        <button type="button" onClick={() => appendToken('.')} className={numKey}>.</button>
        <button
          type="button"
          onClick={handleEvaluate}
          className={`${keyBase} border-[#2563EB] bg-[#2563EB] text-lg font-bold text-white hover:bg-[#1D4ED8] dark:border-[#3B82F6] dark:bg-[#3B82F6] dark:hover:bg-blue-600`}
        >
          =
        </button>
      </div>
    </div>
  );
}
