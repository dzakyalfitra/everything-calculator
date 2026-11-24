import { sanitizeFloat } from './formatter.ts';

export type HealthUnitSystem = 'metric' | 'imperial';
export type Sex = 'male' | 'female';
export type ActivityLevelId =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export interface ActivityLevel {
  id: ActivityLevelId;
  label: string;
  description: string;
  multiplier: number;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise, desk job',
    multiplier: 1.2,
  },
  {
    id: 'light',
    label: 'Lightly Active',
    description: 'Light exercise 1–3 days/week',
    multiplier: 1.375,
  },
  {
    id: 'moderate',
    label: 'Moderately Active',
    description: 'Moderate exercise 3–5 days/week',
    multiplier: 1.55,
  },
  {
    id: 'active',
    label: 'Very Active',
    description: 'Hard exercise 6–7 days/week',
    multiplier: 1.725,
  },
  {
    id: 'very_active',
    label: 'Extra Active',
    description: 'Physical job or intense twice-daily training',
    multiplier: 1.9,
  },
];

export type BmiBand = 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';

export interface BmiResult {
  ok: true;
  bmi: number;
  bmiPrime: number;
  category: BmiBand;
  healthyMinKg: number;
  healthyMaxKg: number;
  healthyMinLb: number;
  healthyMaxLb: number;
  weightKg: number;
  heightCm: number;
  formula: string;
}

export interface HealthError {
  ok: false;
  error: string;
}

export interface CalorieResult {
  ok: true;
  bmr: number;
  maintenanceTdee: number;
  mildLoss: number;
  weightLoss: number;
  mildGain: number;
  activity: ActivityLevel;
  formula: string;
}

export function imperialHeightToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function cmToImperialHeight(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = sanitizeFloat(totalInches - feet * 12);
  return { feet, inches: Number(inches.toFixed(1)) };
}

export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}

export function calculateBmi(
  weightKg: number,
  heightCm: number,
): BmiResult | HealthError {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return { ok: false, error: 'Please enter a realistic weight (> 0).' };
  }
  if (!Number.isFinite(heightCm) || heightCm < 40 || heightCm > 280) {
    return { ok: false, error: 'Please enter a realistic height (40–280 cm).' };
  }

  const heightM = heightCm / 100;
  const bmi = sanitizeFloat(weightKg / (heightM * heightM));
  const bmiPrime = sanitizeFloat(bmi / 25);

  let category: BmiBand;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obesity';

  const healthyMinKg = sanitizeFloat(18.5 * heightM * heightM);
  const healthyMaxKg = sanitizeFloat(24.9 * heightM * heightM);

  return {
    ok: true,
    bmi: Number(bmi.toFixed(1)),
    bmiPrime: Number(bmiPrime.toFixed(2)),
    category,
    healthyMinKg: Number(healthyMinKg.toFixed(1)),
    healthyMaxKg: Number(healthyMaxKg.toFixed(1)),
    healthyMinLb: Number(kgToLb(healthyMinKg).toFixed(1)),
    healthyMaxLb: Number(kgToLb(healthyMaxKg).toFixed(1)),
    weightKg: Number(weightKg.toFixed(1)),
    heightCm: Number(heightCm.toFixed(1)),
    formula: `BMI = ${weightKg.toFixed(1)} kg / (${heightM.toFixed(2)} m)² = ${bmi.toFixed(1)}`,
  };
}

export function calculateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityId: ActivityLevelId,
): CalorieResult | HealthError {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return { ok: false, error: 'Please enter a realistic weight (> 0).' };
  }
  if (!Number.isFinite(heightCm) || heightCm < 40 || heightCm > 280) {
    return { ok: false, error: 'Please enter a realistic height (40–280 cm).' };
  }
  if (!Number.isFinite(age) || age < 10 || age > 120) {
    return { ok: false, error: 'Please enter an age between 10 and 120 years.' };
  }

  const activity =
    ACTIVITY_LEVELS.find((a) => a.id === activityId) ?? ACTIVITY_LEVELS[2];

  // Mifflin-St Jeor equation
  const sexOffset = sex === 'male' ? 5 : -161;
  const rawBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
  const bmr = Math.round(rawBmr);
  const maintenanceTdee = Math.round(rawBmr * activity.multiplier);

  return {
    ok: true,
    bmr,
    maintenanceTdee,
    mildLoss: Math.max(1200, maintenanceTdee - 250),
    weightLoss: Math.max(1200, maintenanceTdee - 500),
    mildGain: maintenanceTdee + 300,
    activity,
    formula: `Mifflin-St Jeor: 10×${weightKg.toFixed(1)} + 6.25×${heightCm.toFixed(1)} − 5×${age} ${sex === 'male' ? '+ 5' : '− 161'} = ${bmr} kcal/day`,
  };
}
