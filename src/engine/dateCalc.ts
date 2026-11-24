export interface DateDifferenceResult {
  ok: true;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  weeks: number;
  remainderDays: number;
  totalHours: number;
  startWeekday: string;
  endWeekday: string;
  isReversed: boolean;
  daysUntilNextAnniversary: number;
  note: string | null;
}

export interface DateError {
  ok: false;
  error: string;
}

export interface DateOffsetResult {
  ok: true;
  resultIso: string;
  weekday: string;
  formula: string;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MS_PER_DAY = 86_400_000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month1Based: number): number {
  if (month1Based === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month1Based)) {
    return 30;
  }
  return 31;
}

interface ParsedDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  utcMs: number;
}

export function parseIsoDate(iso: string): ParsedDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  const utcMs = Date.UTC(year, month - 1, day);
  return { year, month, day, utcMs };
}

function formatIso(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextAnniversaryDays(
  origin: ParsedDate,
  reference: ParsedDate,
): number {
  let targetYear = reference.year;
  const makeTarget = (yr: number) => {
    const day =
      origin.month === 2 && origin.day === 29 && !isLeapYear(yr)
        ? 28
        : origin.day;
    return Date.UTC(yr, origin.month - 1, day);
  };

  let targetMs = makeTarget(targetYear);
  if (targetMs <= reference.utcMs) {
    targetYear += 1;
    targetMs = makeTarget(targetYear);
  }
  return Math.round((targetMs - reference.utcMs) / MS_PER_DAY);
}

export function calculateDateDifference(
  startIso: string,
  endIso: string,
): DateDifferenceResult | DateError {
  const rawStart = parseIsoDate(startIso);
  const rawEnd = parseIsoDate(endIso);
  if (!rawStart || !rawEnd) {
    return { ok: false, error: 'Please enter valid calendar dates (YYYY-MM-DD).' };
  }

  const isReversed = rawStart.utcMs > rawEnd.utcMs;
  const start = isReversed ? rawEnd : rawStart;
  const end = isReversed ? rawStart : rawEnd;

  let years = end.year - start.year;
  let months = end.month - start.month;
  let days = end.day - start.day;

  if (days < 0) {
    months -= 1;
    const prevMonth = end.month === 1 ? 12 : end.month - 1;
    const prevMonthYear = end.month === 1 ? end.year - 1 : end.year;
    days += daysInMonth(prevMonthYear, prevMonth);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((end.utcMs - start.utcMs) / MS_PER_DAY);
  const weeks = Math.floor(totalDays / 7);
  const remainderDays = totalDays % 7;
  const totalHours = totalDays * 24;

  const startWeekday = WEEKDAYS[new Date(rawStart.utcMs).getUTCDay()];
  const endWeekday = WEEKDAYS[new Date(rawEnd.utcMs).getUTCDay()];
  const daysUntilNextAnniversary = nextAnniversaryDays(start, end);

  return {
    ok: true,
    years,
    months,
    days,
    totalDays,
    weeks,
    remainderDays,
    totalHours,
    startWeekday,
    endWeekday,
    isReversed,
    daysUntilNextAnniversary,
    note: isReversed
      ? 'Start date is after end date — showing absolute calendar span.'
      : null,
  };
}

export function addDateOffset(
  baseIso: string,
  direction: 'add' | 'subtract',
  years: number,
  months: number,
  weeks: number,
  days: number,
): DateOffsetResult | DateError {
  const base = parseIsoDate(baseIso);
  if (!base) {
    return { ok: false, error: 'Please enter a valid base date.' };
  }

  const sign = direction === 'add' ? 1 : -1;
  const totalMonths = sign * (Math.trunc(years) * 12 + Math.trunc(months));

  let targetYear = base.year;
  let targetMonth = base.month + totalMonths;
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }

  if (targetYear < 1 || targetYear > 9999) {
    return { ok: false, error: 'Resulting year is out of valid range (0001–9999).' };
  }

  // Clamp day to end of month cleanly (e.g., Jan 31 + 1 month -> Feb 28/29)
  const clampedDay = Math.min(base.day, daysInMonth(targetYear, targetMonth));
  const afterMonthsMs = Date.UTC(targetYear, targetMonth - 1, clampedDay);

  const deltaDays = sign * (Math.trunc(weeks) * 7 + Math.trunc(days));
  const finalDate = new Date(afterMonthsMs + deltaDays * MS_PER_DAY);
  const fy = finalDate.getUTCFullYear();
  if (fy < 1 || fy > 9999) {
    return { ok: false, error: 'Resulting date is out of valid range (0001–9999).' };
  }

  const resultIso = formatIso(
    fy,
    finalDate.getUTCMonth() + 1,
    finalDate.getUTCDate(),
  );
  const weekday = WEEKDAYS[finalDate.getUTCDay()];

  return {
    ok: true,
    resultIso,
    weekday,
    formula: `${baseIso} ${direction === 'add' ? '+' : '−'} (${Math.trunc(years)}y ${Math.trunc(months)}m ${Math.trunc(weeks)}w ${Math.trunc(days)}d) = ${resultIso}`,
  };
}
