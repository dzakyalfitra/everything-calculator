import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, RotateCcw, BookmarkPlus } from 'lucide-react';

export function CopyButton({
  text,
  label = 'Copy',
  size = 'sm',
}: {
  text: string;
  label?: string;
  size?: 'xs' | 'sm';
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for restricted clipboard contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  const pad = size === 'xs' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-tactile inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white font-medium text-[#0F172A] hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9] dark:hover:bg-slate-800 ${pad}`}
      aria-label={`Copy ${text}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#16A34A]" />
          <span className="text-[#16A34A]">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-[#475569] dark:text-slate-400" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export function WorkspaceHeader({
  title,
  subtitle,
  onReset,
  rightSlot,
}: {
  title: string;
  subtitle: string;
  onReset?: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4 dark:border-[#334155]">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#475569] hover:border-slate-300 hover:text-[#0F172A] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 dark:border-[#334155] dark:bg-[#0F172A]"
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`btn-tactile rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-[#2563EB] text-white shadow-xs dark:bg-[#3B82F6]'
                : 'text-[#475569] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryResultCard({
  label,
  value,
  copyValue,
  subtext,
  formula,
  onSave,
  children,
}: {
  label: string;
  value: string;
  copyValue?: string;
  subtext?: string;
  formula?: string;
  onSave?: () => void;
  children?: ReactNode;
}) {
  const [showFormula, setShowFormula] = useState(false);

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#334155] dark:bg-[#0F172A]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium tracking-wide text-[#475569] uppercase dark:text-slate-400">
            {label}
          </div>
          <div className="font-mono-tabular mt-1 break-all text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl dark:text-[#F1F5F9]">
            {value}
          </div>
          {subtext && (
            <div className="mt-1 text-sm text-[#475569] dark:text-slate-400">
              {subtext}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyButton text={copyValue ?? value} label="Copy Result" />
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="btn-tactile inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-blue-600"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {children && <div className="mt-4">{children}</div>}

      {formula && (
        <div className="mt-3 border-t border-[#E2E8F0] pt-2.5 dark:border-[#334155]">
          <button
            type="button"
            onClick={() => setShowFormula((s) => !s)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showFormula ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>Formula &amp; Breakdown</span>
          </button>
          {showFormula && (
            <div className="font-mono-tabular mt-1.5 rounded bg-white px-2.5 py-1.5 text-xs text-[#475569] ring-1 ring-[#E2E8F0] dark:bg-[#1E293B] dark:text-slate-300 dark:ring-[#334155]">
              {formula}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FieldInput({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  inputMode = 'decimal',
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
      >
        {label}
      </label>
      <div className="flex items-center rounded-md border border-[#E2E8F0] bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-[#334155] dark:bg-[#0F172A] dark:focus-within:border-[#3B82F6]">
        {prefix && (
          <span className="font-mono-tabular border-r border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 text-xs font-medium text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono-tabular w-full min-w-0 bg-transparent px-3 py-2 text-sm text-[#0F172A] outline-none placeholder:text-slate-400 dark:text-[#F1F5F9] dark:placeholder:text-slate-500"
        />
        {suffix && (
          <span className="font-mono-tabular border-l border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 text-xs font-medium text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-[#475569] dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export function InlineAlert({
  tone,
  children,
}: {
  tone: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
}) {
  const styles = {
    error:
      'border-[#DC2626]/30 bg-[#DC2626]/8 text-[#DC2626] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400',
    warning:
      'border-[#D97706]/30 bg-[#D97706]/8 text-[#B45309] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    info: 'border-[#2563EB]/25 bg-[#2563EB]/6 text-[#1D4ED8] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    success:
      'border-[#16A34A]/30 bg-[#16A34A]/8 text-[#15803D] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  }[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-md border px-3 py-2 text-xs font-medium ${styles}`}
    >
      {children}
    </div>
  );
}
