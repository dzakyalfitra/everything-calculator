import { sanitizeFloat } from './formatter.ts';

export type UnitCategoryId =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'volume'
  | 'area'
  | 'speed'
  | 'data';

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  /** Factor to convert 1 unit into category's base unit (ignored for temperature) */
  toBase: number;
}

export interface UnitCategory {
  id: UnitCategoryId;
  name: string;
  allowNegative: boolean;
  units: UnitDefinition[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    allowNegative: false,
    units: [
      { id: 'mm', label: 'Millimeter', symbol: 'mm', toBase: 0.001 },
      { id: 'cm', label: 'Centimeter', symbol: 'cm', toBase: 0.01 },
      { id: 'm', label: 'Meter', symbol: 'm', toBase: 1 },
      { id: 'km', label: 'Kilometer', symbol: 'km', toBase: 1000 },
      { id: 'in', label: 'Inch', symbol: 'in', toBase: 0.0254 },
      { id: 'ft', label: 'Foot', symbol: 'ft', toBase: 0.3048 },
      { id: 'yd', label: 'Yard', symbol: 'yd', toBase: 0.9144 },
      { id: 'mi', label: 'Mile', symbol: 'mi', toBase: 1609.344 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight & Mass',
    allowNegative: false,
    units: [
      { id: 'mg', label: 'Milligram', symbol: 'mg', toBase: 0.000001 },
      { id: 'g', label: 'Gram', symbol: 'g', toBase: 0.001 },
      { id: 'kg', label: 'Kilogram', symbol: 'kg', toBase: 1 },
      { id: 't', label: 'Metric Ton', symbol: 't', toBase: 1000 },
      { id: 'oz', label: 'Ounce', symbol: 'oz', toBase: 0.028349523125 },
      { id: 'lb', label: 'Pound', symbol: 'lb', toBase: 0.45359237 },
      { id: 'st', label: 'Stone', symbol: 'st', toBase: 6.35029318 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    allowNegative: true,
    units: [
      { id: 'c', label: 'Celsius', symbol: '°C', toBase: 1 },
      { id: 'f', label: 'Fahrenheit', symbol: '°F', toBase: 1 },
      { id: 'k', label: 'Kelvin', symbol: 'K', toBase: 1 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume & Cooking',
    allowNegative: false,
    units: [
      { id: 'ml', label: 'Milliliter', symbol: 'mL', toBase: 0.001 },
      { id: 'l', label: 'Liter', symbol: 'L', toBase: 1 },
      { id: 'tsp', label: 'US Teaspoon', symbol: 'tsp', toBase: 0.00492892159375 },
      { id: 'tbsp', label: 'US Tablespoon', symbol: 'tbsp', toBase: 0.01478676478125 },
      { id: 'floz', label: 'US Fluid Ounce', symbol: 'fl oz', toBase: 0.0295735295625 },
      { id: 'cup', label: 'US Cup', symbol: 'cup', toBase: 0.2365882365 },
      { id: 'pt', label: 'US Pint', symbol: 'pt', toBase: 0.473176473 },
      { id: 'qt', label: 'US Quart', symbol: 'qt', toBase: 0.946352946 },
      { id: 'gal', label: 'US Gallon', symbol: 'gal', toBase: 3.785411784 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    allowNegative: false,
    units: [
      { id: 'sqm', label: 'Square Meter', symbol: 'm²', toBase: 1 },
      { id: 'sqkm', label: 'Square Kilometer', symbol: 'km²', toBase: 1_000_000 },
      { id: 'ha', label: 'Hectare', symbol: 'ha', toBase: 10_000 },
      { id: 'sqft', label: 'Square Foot', symbol: 'ft²', toBase: 0.09290304 },
      { id: 'sqyd', label: 'Square Yard', symbol: 'yd²', toBase: 0.83612736 },
      { id: 'acre', label: 'Acre', symbol: 'acre', toBase: 4046.8564224 },
      { id: 'sqmi', label: 'Square Mile', symbol: 'mi²', toBase: 2_589_988.110336 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    allowNegative: false,
    units: [
      { id: 'mps', label: 'Meters / sec', symbol: 'm/s', toBase: 1 },
      { id: 'kmh', label: 'Kilometers / hour', symbol: 'km/h', toBase: 1 / 3.6 },
      { id: 'mph', label: 'Miles / hour', symbol: 'mph', toBase: 0.44704 },
      { id: 'knot', label: 'Knot', symbol: 'kn', toBase: 1852 / 3600 },
    ],
  },
  {
    id: 'data',
    name: 'Data Storage',
    allowNegative: false,
    units: [
      { id: 'b', label: 'Byte', symbol: 'B', toBase: 1 },
      { id: 'kb', label: 'Kilobyte (10³)', symbol: 'KB', toBase: 1e3 },
      { id: 'mb', label: 'Megabyte (10⁶)', symbol: 'MB', toBase: 1e6 },
      { id: 'gb', label: 'Gigabyte (10⁹)', symbol: 'GB', toBase: 1e9 },
      { id: 'tb', label: 'Terabyte (10¹²)', symbol: 'TB', toBase: 1e12 },
      { id: 'kib', label: 'Kibibyte (2¹⁰)', symbol: 'KiB', toBase: 1024 },
      { id: 'mib', label: 'Mebibyte (2²⁰)', symbol: 'MiB', toBase: 1024 ** 2 },
      { id: 'gib', label: 'Gibibyte (2³⁰)', symbol: 'GiB', toBase: 1024 ** 3 },
      { id: 'tib', label: 'Tebibyte (2⁴⁰)', symbol: 'TiB', toBase: 1024 ** 4 },
    ],
  },
];

export interface UnitConversionResult {
  ok: true;
  value: number;
  formula: string;
  allUnits: { unit: UnitDefinition; value: number }[];
}

export interface UnitConversionError {
  ok: false;
  error: string;
}

function toKelvin(value: number, fromId: string): number {
  if (fromId === 'c') return value + 273.15;
  if (fromId === 'f') return ((value - 32) * 5) / 9 + 273.15;
  return value;
}

function fromKelvin(kelvin: number, toId: string): number {
  if (toId === 'c') return kelvin - 273.15;
  if (toId === 'f') return ((kelvin - 273.15) * 9) / 5 + 32;
  return kelvin;
}

export function convertUnit(
  categoryId: UnitCategoryId,
  value: number,
  fromUnitId: string,
  toUnitId: string,
): UnitConversionResult | UnitConversionError {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return { ok: false, error: 'Unknown unit category' };
  }

  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: 'Invalid source or target unit' };
  }

  if (category.id === 'temperature') {
    const kelvin = toKelvin(value, fromUnit.id);
    if (kelvin < -1e-9) {
      return {
        ok: false,
        error: 'Below absolute zero (-273.15 °C / -459.67 °F / 0 K)',
      };
    }
    const clampedK = Math.max(0, kelvin);
    const converted = sanitizeFloat(fromKelvin(clampedK, toUnit.id));
    const allUnits = category.units.map((u) => ({
      unit: u,
      value: sanitizeFloat(fromKelvin(clampedK, u.id)),
    }));

    let formula = '';
    if (fromUnit.id === 'c' && toUnit.id === 'f') {
      formula = `(${value} °C × 9/5) + 32 = ${converted} °F`;
    } else if (fromUnit.id === 'f' && toUnit.id === 'c') {
      formula = `(${value} °F − 32) × 5/9 = ${converted} °C`;
    } else {
      formula = `${value} ${fromUnit.symbol} = ${sanitizeFloat(clampedK)} K = ${converted} ${toUnit.symbol}`;
    }

    return { ok: true, value: converted, formula, allUnits };
  }

  if (!category.allowNegative && value < 0) {
    return {
      ok: false,
      error: `${category.name} cannot be negative.`,
    };
  }

  const baseValue = value * fromUnit.toBase;
  const converted = sanitizeFloat(baseValue / toUnit.toBase);
  const ratio = sanitizeFloat(fromUnit.toBase / toUnit.toBase);
  const allUnits = category.units.map((u) => ({
    unit: u,
    value: sanitizeFloat(baseValue / u.toBase),
  }));

  return {
    ok: true,
    value: converted,
    formula: `1 ${fromUnit.symbol} = ${ratio} ${toUnit.symbol}`,
    allUnits,
  };
}
