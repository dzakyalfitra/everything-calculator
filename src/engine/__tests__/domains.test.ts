import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiscountAndTax,
  calculatePercentChange,
  calculatePercentOf,
} from '../percentage.ts';
import { calculateTipSplit } from '../tipSplit.ts';
import { convertUnit } from '../unitConverter.ts';
import { addDateOffset, calculateDateDifference } from '../dateCalc.ts';
import {
  calculateCompoundInterest,
  calculateLoan,
  calculateSimpleInterest,
} from '../finance.ts';
import { convertCurrency } from '../currency.ts';
import { calculateBmi, calculateDailyCalories } from '../health.ts';
import { calculateStatistics } from '../statistics.ts';

describe('Percentage & Discount', () => {
  it('computes X% of Y, % change, and guards 0 base', () => {
    const p = calculatePercentOf(15, 200);
    assert.equal(p.value, 30);

    const ch = calculatePercentChange(100, 125);
    assert.equal(ch.ok, true);
    if (ch.ok) {
      assert.equal(ch.percentChange, 25);
      assert.equal(ch.direction, 'increase');
    }

    const zeroBase = calculatePercentChange(0, 50);
    assert.equal(zeroBase.ok, false);
  });

  it('clamps out-of-range discounts and computes final price with tax', () => {
    const d = calculateDiscountAndTax(100, 20, 10);
    assert.equal(d.discountSavings, 20);
    assert.equal(d.priceAfterDiscount, 80);
    assert.equal(d.taxAmount, 8);
    assert.equal(d.finalPrice, 88);

    const over = calculateDiscountAndTax(100, 150, -5);
    assert.equal(over.finalPrice, 0);
    assert.equal(over.warnings.length, 2);
  });
});

describe('Tip & Bill Split', () => {
  it('splits bill cleanly and notes penny rounding', () => {
    const res = calculateTipSplit({
      billAmount: 100,
      taxAmount: 0,
      tipPercent: 0,
      partySize: 3,
      tipOnPreTax: false,
      roundUpPerPerson: false,
    });
    assert.equal(res.totalBill, 100);
    assert.ok(res.roundingNote !== null);
  });

  it('supports pre-tax tip base and whole-unit roundup', () => {
    const res = calculateTipSplit({
      billAmount: 110,
      taxAmount: 10,
      tipPercent: 20,
      partySize: 2,
      tipOnPreTax: true,
      roundUpPerPerson: true,
    });
    assert.equal(res.tipBase, 100);
    assert.equal(res.tipAmount, 20);
    assert.equal(res.perPerson, 65);
  });
});

describe('Unit Converter', () => {
  it('converts temperature and blocks below absolute zero', () => {
    const cToF = convertUnit('temperature', 100, 'c', 'f');
    assert.equal(cToF.ok, true);
    if (cToF.ok) assert.equal(cToF.value, 212);

    const belowAbs = convertUnit('temperature', -300, 'c', 'k');
    assert.equal(belowAbs.ok, false);
  });

  it('converts length and blocks negative physical lengths', () => {
    const kmToMi = convertUnit('length', 10, 'km', 'mi');
    assert.equal(kmToMi.ok, true);
    if (kmToMi.ok) assert.ok(Math.abs(kmToMi.value - 6.21371192) < 1e-6);

    const negLen = convertUnit('length', -5, 'm', 'cm');
    assert.equal(negLen.ok, false);
  });
});

describe('Date & Age Difference', () => {
  it('handles leap years, reversed dates, and month-end rollovers', () => {
    const diff = calculateDateDifference('2024-02-28', '2024-03-01');
    assert.equal(diff.ok, true);
    if (diff.ok) assert.equal(diff.totalDays, 2);

    const reversed = calculateDateDifference('2026-05-10', '2026-05-01');
    assert.equal(reversed.ok, true);
    if (reversed.ok) {
      assert.equal(reversed.isReversed, true);
      assert.equal(reversed.totalDays, 9);
    }

    const offset = addDateOffset('2026-01-31', 'add', 0, 1, 0, 0);
    assert.equal(offset.ok, true);
    if (offset.ok) assert.equal(offset.resultIso, '2026-02-28');
  });
});

describe('Finance: Loan, Compound & Simple Interest', () => {
  it('handles 0% APR loan cleanly without division by zero', () => {
    const loan = calculateLoan({
      principal: 12000,
      annualRatePercent: 0,
      termValue: 1,
      termUnit: 'years',
    });
    assert.equal(loan.ok, true);
    if (loan.ok) {
      assert.equal(loan.monthlyPayment, 1000);
      assert.equal(loan.totalInterest, 0);
    }
  });

  it('computes standard amortized loan, compound interest, and simple interest', () => {
    const loan = calculateLoan({
      principal: 300000,
      annualRatePercent: 5,
      termValue: 30,
      termUnit: 'years',
    });
    assert.equal(loan.ok, true);
    if (loan.ok) {
      assert.ok(Math.abs(loan.monthlyPayment - 1610.46) < 0.05);
    }

    const comp = calculateCompoundInterest({
      initialPrincipal: 10000,
      monthlyContribution: 200,
      annualRatePercent: 6,
      years: 10,
      compounding: 'monthly',
    });
    assert.equal(comp.ok, true);
    if (comp.ok) {
      assert.ok(comp.futureValue > 50000);
    }

    const simp = calculateSimpleInterest({
      principal: 5000,
      annualRatePercent: 4,
      timeValue: 18,
      timeUnit: 'months',
    });
    assert.equal(simp.ok, true);
    if (simp.ok) {
      assert.equal(simp.interest, 300);
      assert.equal(simp.totalAmount, 5300);
    }
  });
});

describe('Currency Converter', () => {
  it('supports reference rates and custom rate override', () => {
    const ref = convertCurrency(100, 'USD', 'EUR');
    assert.equal(ref.ok, true);
    if (ref.ok) {
      assert.equal(ref.isCustomRate, false);
      assert.equal(ref.convertedAmount, 92);
    }

    const custom = convertCurrency(100, 'USD', 'EUR', 0.95);
    assert.equal(custom.ok, true);
    if (custom.ok) {
      assert.equal(custom.isCustomRate, true);
      assert.equal(custom.convertedAmount, 95);
    }
  });
});

describe('Health & Fitness', () => {
  it('computes BMI and Mifflin-St Jeor calories', () => {
    const bmi = calculateBmi(70, 175);
    assert.equal(bmi.ok, true);
    if (bmi.ok) {
      assert.equal(bmi.bmi, 22.9);
      assert.equal(bmi.category, 'Normal weight');
    }

    const cal = calculateDailyCalories(70, 175, 30, 'male', 'moderate');
    assert.equal(cal.ok, true);
    if (cal.ok) {
      assert.equal(cal.bmr, 1649);
      assert.equal(cal.maintenanceTdee, 2556);
    }
  });
});

describe('Basic Statistics', () => {
  it('computes full summary and handles single-value & invalid tokens', () => {
    const single = calculateStatistics('42');
    assert.equal(single.ok, true);
    if (single.ok) {
      assert.equal(single.count, 1);
      assert.equal(single.sampleStdDev, null);
      assert.equal(single.modeLabel, 'No mode');
    }

    const multi = calculateStatistics('10, 20, foo, 20, 30\n40');
    assert.equal(multi.ok, true);
    if (multi.ok) {
      assert.equal(multi.count, 5);
      assert.deepEqual(multi.invalidTokens, ['foo']);
      assert.equal(multi.mean, 24);
      assert.equal(multi.median, 20);
      assert.deepEqual(multi.modes, [20]);
    }
  });
});
