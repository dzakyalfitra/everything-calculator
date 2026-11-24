export type CalculatorModeId =
  | 'standard'
  | 'percentage'
  | 'tip'
  | 'unit'
  | 'date'
  | 'finance'
  | 'currency'
  | 'health'
  | 'statistics';

export type CalculatorGroupId = 'everyday' | 'converters' | 'finance' | 'health';

export interface CalculatorModeMeta {
  id: CalculatorModeId;
  group: CalculatorGroupId;
  groupLabel: string;
  label: string;
  shortLabel: string;
  description: string;
  keywords: string[];
}

export const CALCULATOR_GROUPS: { id: CalculatorGroupId; label: string }[] = [
  { id: 'everyday', label: 'EVERYDAY MATH' },
  { id: 'converters', label: 'CONVERTERS & TIME' },
  { id: 'finance', label: 'FINANCE' },
  { id: 'health', label: 'HEALTH & DATA' },
];

export const CALCULATOR_MODES: CalculatorModeMeta[] = [
  {
    id: 'standard',
    group: 'everyday',
    groupLabel: 'Everyday Math',
    label: 'Standard & Scientific',
    shortLabel: 'Standard / Sci',
    description: 'Full keypad, expression parser, parentheses, memory, and scientific functions.',
    keywords: ['math', 'scientific', 'trig', 'sin', 'cos', 'log', 'sqrt', 'power'],
  },
  {
    id: 'percentage',
    group: 'everyday',
    groupLabel: 'Everyday Math',
    label: 'Percentage & Discount',
    shortLabel: 'Percent & Discount',
    description: 'Solve X% of Y, percentage change, and retail discounts with sales tax or VAT.',
    keywords: ['percent', 'discount', 'sale', 'tax', 'vat', 'markup', 'change'],
  },
  {
    id: 'tip',
    group: 'everyday',
    groupLabel: 'Everyday Math',
    label: 'Tip & Bill Split',
    shortLabel: 'Tip & Bill Split',
    description: 'Split dining bills evenly, tip pre-tax or total, and round up per person.',
    keywords: ['tip', 'gratuity', 'bill', 'split', 'restaurant', 'check'],
  },
  {
    id: 'unit',
    group: 'converters',
    groupLabel: 'Converters & Time',
    label: 'Unit Converter',
    shortLabel: 'Unit Converter',
    description: 'Convert length, weight, temperature, volume, area, speed, and data storage.',
    keywords: ['unit', 'convert', 'metric', 'imperial', 'celsius', 'fahrenheit', 'km', 'miles', 'kg', 'lb', 'gb'],
  },
  {
    id: 'date',
    group: 'converters',
    groupLabel: 'Converters & Time',
    label: 'Date & Age Difference',
    shortLabel: 'Date & Age Diff',
    description: 'Exact calendar span, weekday finder, next anniversary countdown, and date offsets.',
    keywords: ['date', 'age', 'days', 'calendar', 'birthday', 'countdown', 'weeks'],
  },
  {
    id: 'finance',
    group: 'finance',
    groupLabel: 'Finance',
    label: 'Loan, Compound & Simple Interest',
    shortLabel: 'Interest & Loans',
    description: 'Amortized loans & mortgages, compound growth with contributions, and simple interest.',
    keywords: ['loan', 'mortgage', 'compound', 'simple', 'interest', 'apr', 'amortization', 'savings'],
  },
  {
    id: 'currency',
    group: 'finance',
    groupLabel: 'Finance',
    label: 'Currency Converter',
    shortLabel: 'Currency Rates',
    description: 'Offline-first converter for 24 world currencies with editable live bank rate override.',
    keywords: ['currency', 'fx', 'exchange', 'dollar', 'euro', 'yen', 'pound', 'rupee'],
  },
  {
    id: 'health',
    group: 'health',
    groupLabel: 'Health & Data',
    label: 'Health & Fitness',
    shortLabel: 'Health (BMI/Cal)',
    description: 'BMI with WHO bands & healthy weight range, plus Mifflin-St Jeor BMR & TDEE calories.',
    keywords: ['bmi', 'calorie', 'bmr', 'tdee', 'weight', 'fitness', 'health', 'diet'],
  },
  {
    id: 'statistics',
    group: 'health',
    groupLabel: 'Health & Data',
    label: 'Basic Statistics',
    shortLabel: 'Basic Statistics',
    description: 'Mean, median, mode, variance, standard deviation, quartiles, and live distribution.',
    keywords: ['stats', 'statistics', 'mean', 'median', 'mode', 'std', 'variance', 'quartile'],
  },
];

export interface HistoryEntry {
  id: string;
  mode: CalculatorModeId;
  modeLabel: string;
  summary: string;
  result: string;
  reloadExpression?: string;
  timestamp: number;
}
