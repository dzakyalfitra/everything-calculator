import { formatNumber, parseNumericInput } from '../../engine/formatter.ts';
import {
  ACTIVITY_LEVELS,
  calculateBmi,
  calculateDailyCalories,
  cmToImperialHeight,
  imperialHeightToCm,
  kgToLb,
  lbToKg,
  type ActivityLevelId,
  type BmiBand,
  type HealthUnitSystem,
} from '../../engine/health.ts';
import type { HealthSession } from '../../state/useSessionCache.ts';
import {
  FieldInput,
  InlineAlert,
  PrimaryResultCard,
  SegmentedTabs,
  WorkspaceHeader,
} from '../shared/UiPrimitives.tsx';

function bmiTone(band: BmiBand): string {
  switch (band) {
    case 'Normal weight':
      return 'bg-[#16A34A]/12 text-[#15803D] border-[#16A34A]/30 dark:text-emerald-300';
    case 'Underweight':
      return 'bg-[#2563EB]/12 text-[#1D4ED8] border-[#2563EB]/30 dark:text-blue-300';
    case 'Overweight':
      return 'bg-[#D97706]/12 text-[#B45309] border-[#D97706]/30 dark:text-amber-300';
    case 'Obesity':
      return 'bg-[#DC2626]/12 text-[#DC2626] border-[#DC2626]/30 dark:text-red-300';
  }
}

export function HealthCalculator({
  session,
  onChange,
  onReset,
  unitSystem,
  onChangeUnitSystem,
  onAddHistory,
}: {
  session: HealthSession;
  onChange: (updater: Partial<HealthSession>) => void;
  onReset: () => void;
  unitSystem: HealthUnitSystem;
  onChangeUnitSystem: (sys: HealthUnitSystem) => void;
  onAddHistory: (summary: string, result: string) => void;
}) {
  const switchUnitSystem = (next: HealthUnitSystem) => {
    if (next === unitSystem) return;
    if (next === 'imperial') {
      const kg = parseNumericInput(session.weightKg) ?? 70;
      const cm = parseNumericInput(session.heightCm) ?? 175;
      const impH = cmToImperialHeight(cm);
      onChange({
        weightLb: String(Number(kgToLb(kg).toFixed(1))),
        heightFt: String(impH.feet),
        heightIn: String(impH.inches),
      });
    } else {
      const lb = parseNumericInput(session.weightLb) ?? 154.3;
      const ft = parseNumericInput(session.heightFt) ?? 5;
      const inc = parseNumericInput(session.heightIn) ?? 9;
      onChange({
        weightKg: String(Number(lbToKg(lb).toFixed(1))),
        heightCm: String(Number(imperialHeightToCm(ft, inc).toFixed(1))),
      });
    }
    onChangeUnitSystem(next);
  };

  const weightKg =
    unitSystem === 'metric'
      ? parseNumericInput(session.weightKg)
      : (() => {
          const lb = parseNumericInput(session.weightLb);
          return lb !== null ? lbToKg(lb) : null;
        })();

  const heightCm =
    unitSystem === 'metric'
      ? parseNumericInput(session.heightCm)
      : (() => {
          const ft = parseNumericInput(session.heightFt);
          const inc = parseNumericInput(session.heightIn) ?? 0;
          return ft !== null ? imperialHeightToCm(ft, inc) : null;
        })();

  const bmiRes =
    weightKg !== null && heightCm !== null
      ? calculateBmi(weightKg, heightCm)
      : null;

  const ageNum = parseNumericInput(session.age);
  const calorieRes =
    weightKg !== null && heightCm !== null && ageNum !== null
      ? calculateDailyCalories(
          weightKg,
          heightCm,
          ageNum,
          session.sex,
          session.activity,
        )
      : null;

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Health & Fitness"
        subtitle="Body Mass Index (WHO bands) and daily calorie estimates via Mifflin-St Jeor."
        onReset={onReset}
        rightSlot={
          <SegmentedTabs
            value={unitSystem}
            onChange={switchUnitSystem}
            options={[
              { id: 'metric', label: 'Metric (kg/cm)' },
              { id: 'imperial', label: 'Imperial (lb/ft)' },
            ]}
          />
        }
      />

      <SegmentedTabs
        value={session.tab}
        onChange={(tab) => onChange({ tab })}
        options={[
          { id: 'bmi', label: 'BMI Calculator' },
          { id: 'calories', label: 'Daily Calories (BMR & TDEE)' },
        ]}
      />

      {/* Shared Body Inputs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {unitSystem === 'metric' ? (
          <>
            <FieldInput
              id="hlth-weight-kg"
              label="Weight"
              value={session.weightKg}
              onChange={(weightKgVal) => onChange({ weightKg: weightKgVal })}
              suffix="kg"
            />
            <FieldInput
              id="hlth-height-cm"
              label="Height"
              value={session.heightCm}
              onChange={(heightCmVal) => onChange({ heightCm: heightCmVal })}
              suffix="cm"
            />
          </>
        ) : (
          <>
            <FieldInput
              id="hlth-weight-lb"
              label="Weight"
              value={session.weightLb}
              onChange={(weightLbVal) => onChange({ weightLb: weightLbVal })}
              suffix="lb"
            />
            <div className="grid grid-cols-2 gap-2">
              <FieldInput
                id="hlth-height-ft"
                label="Height (ft)"
                value={session.heightFt}
                onChange={(heightFtVal) => onChange({ heightFt: heightFtVal })}
                suffix="ft"
              />
              <FieldInput
                id="hlth-height-in"
                label="Height (in)"
                value={session.heightIn}
                onChange={(heightInVal) => onChange({ heightIn: heightInVal })}
                suffix="in"
              />
            </div>
          </>
        )}

        {session.tab === 'calories' && (
          <>
            <FieldInput
              id="hlth-age"
              label="Age"
              value={session.age}
              onChange={(ageVal) => onChange({ age: ageVal })}
              suffix="yrs"
              inputMode="numeric"
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300">
                Sex
              </span>
              <SegmentedTabs
                value={session.sex}
                onChange={(sex) => onChange({ sex })}
                options={[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                ]}
              />
            </div>
          </>
        )}
      </div>

      {session.tab === 'calories' && (
        <div>
          <label
            htmlFor="hlth-activity"
            className="mb-1.5 block text-xs font-medium text-[#475569] dark:text-slate-300"
          >
            Activity Level
          </label>
          <select
            id="hlth-activity"
            value={session.activity}
            onChange={(e) =>
              onChange({ activity: e.target.value as ActivityLevelId })
            }
            className="h-[38px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
          >
            {ACTIVITY_LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.label} (×{lvl.multiplier}) — {lvl.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {session.tab === 'bmi' && (
        <>
          {bmiRes === null ? (
            <InlineAlert tone="info">
              Enter height and weight to compute BMI.
            </InlineAlert>
          ) : !bmiRes.ok ? (
            <InlineAlert tone="error">{bmiRes.error}</InlineAlert>
          ) : (
            <PrimaryResultCard
              label="Body Mass Index (BMI)"
              value={String(bmiRes.bmi)}
              subtext={`Healthy weight range for your height: ${
                unitSystem === 'metric'
                  ? `${bmiRes.healthyMinKg}–${bmiRes.healthyMaxKg} kg`
                  : `${bmiRes.healthyMinLb}–${bmiRes.healthyMaxLb} lb`
              }`}
              formula={bmiRes.formula}
              onSave={() =>
                onAddHistory(
                  `BMI (${bmiRes.weightKg}kg, ${bmiRes.heightCm}cm)`,
                  `${bmiRes.bmi} (${bmiRes.category})`,
                )
              }
            >
              <div className="space-y-3 border-t border-[#E2E8F0] pt-3 dark:border-[#334155]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${bmiTone(bmiRes.category)}`}
                  >
                    {bmiRes.category}
                  </span>
                  <span className="font-mono-tabular text-xs text-[#475569] dark:text-slate-400">
                    BMI Prime: {bmiRes.bmiPrime}
                  </span>
                </div>

                {/* WHO spectrum bar */}
                <div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium text-[#475569] dark:text-slate-400">
                    <div className="rounded bg-[#2563EB]/20 py-1 text-[#1D4ED8] dark:text-blue-300">
                      &lt; 18.5
                    </div>
                    <div className="rounded bg-[#16A34A]/20 py-1 text-[#15803D] dark:text-emerald-300">
                      18.5 – 24.9
                    </div>
                    <div className="rounded bg-[#D97706]/20 py-1 text-[#B45309] dark:text-amber-300">
                      25 – 29.9
                    </div>
                    <div className="rounded bg-[#DC2626]/20 py-1 text-[#DC2626] dark:text-red-300">
                      ≥ 30
                    </div>
                  </div>
                </div>
              </div>
            </PrimaryResultCard>
          )}
        </>
      )}

      {session.tab === 'calories' && (
        <>
          {calorieRes === null ? (
            <InlineAlert tone="info">
              Enter weight, height, and age to estimate daily calories.
            </InlineAlert>
          ) : !calorieRes.ok ? (
            <InlineAlert tone="error">{calorieRes.error}</InlineAlert>
          ) : (
            <PrimaryResultCard
              label="Maintenance Daily Calories (TDEE)"
              value={`${formatNumber(calorieRes.maintenanceTdee)} kcal/day`}
              copyValue={String(calorieRes.maintenanceTdee)}
              subtext={`Basal Metabolic Rate (BMR): ${formatNumber(calorieRes.bmr)} kcal/day`}
              formula={calorieRes.formula}
              onSave={() =>
                onAddHistory(
                  `TDEE (${session.sex}, ${ageNum}y, ${calorieRes.activity.label})`,
                  `${formatNumber(calorieRes.maintenanceTdee)} kcal/day`,
                )
              }
            >
              <div className="grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#334155]">
                <div>
                  <div className="text-[#475569] dark:text-slate-400">
                    Weight Loss (−500)
                  </div>
                  <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatNumber(calorieRes.weightLoss)} kcal
                  </div>
                </div>
                <div>
                  <div className="text-[#475569] dark:text-slate-400">
                    Mild Loss (−250)
                  </div>
                  <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatNumber(calorieRes.mildLoss)} kcal
                  </div>
                </div>
                <div>
                  <div className="text-[#475569] dark:text-slate-400">
                    Mild Gain (+300)
                  </div>
                  <div className="font-mono-tabular mt-0.5 font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                    {formatNumber(calorieRes.mildGain)} kcal
                  </div>
                </div>
              </div>
            </PrimaryResultCard>
          )}
        </>
      )}

      <p className="text-[11px] text-[#475569] dark:text-slate-400">
        Informational estimates only — not medical advice. Consult a healthcare professional for personalized guidance.
      </p>
    </div>
  );
}
