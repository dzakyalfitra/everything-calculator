import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompoundSeries,
  buildLoanSeries,
  computeBmiGaugePercent,
  computeBoxPlotPositions,
  computeNiceTicks,
  formatCompactNumber,
} from '../chartGeometry.ts';
import { calculateCompoundInterest, calculateLoan } from '../finance.ts';

describe('Chart Geometry Helpers', () => {
  it('formats compact axis numbers across scales', () => {
    assert.equal(formatCompactNumber(0, '$'), '$0');
    assert.equal(formatCompactNumber(750, '$'), '$750');
    assert.equal(formatCompactNumber(12500, '$'), '$12.5k');
    assert.equal(formatCompactNumber(2400000, '$'), '$2.4M');
    assert.equal(formatCompactNumber(1500000000), '1.5B');
  });

  it('computes nice axis ticks including zero-max fallback', () => {
    const zeroAxis = computeNiceTicks(0, 4);
    assert.equal(zeroAxis.maxTick, 1);
    assert.equal(zeroAxis.ticks.length, 5);

    const axis = computeNiceTicks(43210, 4);
    assert.ok(axis.maxTick >= 43210);
    assert.equal(axis.ticks[0], 0);
    assert.equal(axis.ticks[axis.ticks.length - 1], axis.maxTick);
  });

  it('builds compound series with Year 0 including 0-year edge case', () => {
    const zeroYears = calculateCompoundInterest({
      initialPrincipal: 5000,
      monthlyContribution: 100,
      annualRatePercent: 6,
      years: 0,
      compounding: 'monthly',
    });
    assert.equal(zeroYears.ok, true);
    if (zeroYears.ok) {
      const series = buildCompoundSeries(5000, zeroYears.yearlyGrowth);
      assert.equal(series.length, 1);
      assert.equal(series[0].year, 0);
      assert.equal(series[0].balance, 5000);
    }

    const tenYears = calculateCompoundInterest({
      initialPrincipal: 10000,
      monthlyContribution: 200,
      annualRatePercent: 7,
      years: 10,
      compounding: 'monthly',
    });
    assert.equal(tenYears.ok, true);
    if (tenYears.ok) {
      const series = buildCompoundSeries(10000, tenYears.yearlyGrowth);
      assert.equal(series.length, 11);
      assert.equal(series[0].interest, 0);
      assert.equal(series[10].balance, tenYears.futureValue);
    }
  });

  it('builds loan series with cumulative totals and 0% APR support', () => {
    const zeroApr = calculateLoan({
      principal: 12000,
      annualRatePercent: 0,
      termValue: 2,
      termUnit: 'years',
    });
    assert.equal(zeroApr.ok, true);
    if (zeroApr.ok) {
      const series = buildLoanSeries(12000, zeroApr.yearlySchedule);
      assert.equal(series.length, 3);
      assert.equal(series[0].remainingBalance, 12000);
      assert.equal(series[2].remainingBalance, 0);
      assert.equal(series[2].cumulativeInterest, 0);
      assert.equal(series[2].cumulativePrincipal, 12000);
    }
  });

  it('normalizes box plot positions and handles degenerate single-value input', () => {
    const single = computeBoxPlotPositions({
      min: 42,
      q1: 42,
      median: 42,
      q3: 42,
      max: 42,
      mean: 42,
    });
    assert.equal(single.isDegenerate, true);
    assert.equal(single.median, 0.5);

    const spread = computeBoxPlotPositions({
      min: 10,
      q1: 20,
      median: 30,
      q3: 40,
      max: 50,
      mean: 32,
    });
    assert.equal(spread.isDegenerate, false);
    assert.equal(spread.min, 0);
    assert.equal(spread.q1, 0.25);
    assert.equal(spread.median, 0.5);
    assert.equal(spread.q3, 0.75);
    assert.equal(spread.max, 1);
    assert.equal(spread.mean, 0.55);
  });

  it('maps BMI across WHO bands and clamps extreme values', () => {
    assert.equal(computeBmiGaugePercent(8), 0);
    assert.equal(computeBmiGaugePercent(18.5), 25);
    assert.equal(computeBmiGaugePercent(25), 50);
    assert.equal(computeBmiGaugePercent(30), 75);
    assert.equal(computeBmiGaugePercent(55), 100);

    const normal = computeBmiGaugePercent(22.9);
    assert.ok(normal > 25 && normal < 50);
  });
});
