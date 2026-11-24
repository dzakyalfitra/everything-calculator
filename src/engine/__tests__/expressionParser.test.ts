import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression } from '../expressionParser.ts';
import { formatCurrency, formatNumber, getCurrencyOption, sanitizeFloat } from '../formatter.ts';

describe('Expression Parser & Formatter', () => {
  it('cleans IEEE-754 floating point artifacts', () => {
    assert.equal(sanitizeFloat(0.1 + 0.2), 0.3);
    const res = evaluateExpression('0.1 + 0.2');
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.value, 0.3);
  });

  it('respects operator precedence and parentheses', () => {
    const r1 = evaluateExpression('2 + 3 * 4');
    assert.equal(r1.ok, true);
    if (r1.ok) assert.equal(r1.value, 14);

    const r2 = evaluateExpression('(2 + 3) * 4');
    assert.equal(r2.ok, true);
    if (r2.ok) assert.equal(r2.value, 20);

    const r3 = evaluateExpression('2^3^2');
    assert.equal(r3.ok, true);
    if (r3.ok) assert.equal(r3.value, 512);
  });

  it('supports implicit multiplication and auto-balanced trailing parens', () => {
    const r1 = evaluateExpression('2(3+4)');
    assert.equal(r1.ok, true);
    if (r1.ok) assert.equal(r1.value, 14);

    const r2 = evaluateExpression('(2+3)(4+5');
    assert.equal(r2.ok, true);
    if (r2.ok) assert.equal(r2.value, 45);
  });

  it('evaluates scientific functions in deg and rad modes', () => {
    const sin30 = evaluateExpression('sin(30)', 'deg');
    assert.equal(sin30.ok, true);
    if (sin30.ok) assert.equal(sin30.value, 0.5);

    const cosPi = evaluateExpression('cos(pi)', 'rad');
    assert.equal(cosPi.ok, true);
    if (cosPi.ok) assert.equal(cosPi.value, -1);

    const sin180 = evaluateExpression('sin(180)', 'deg');
    assert.equal(sin180.ok, true);
    if (sin180.ok) assert.equal(sin180.value, 0);
  });

  it('handles factorials, percentages, and roots', () => {
    const fact5 = evaluateExpression('5!');
    assert.equal(fact5.ok, true);
    if (fact5.ok) assert.equal(fact5.value, 120);

    const fact0 = evaluateExpression('0!');
    assert.equal(fact0.ok, true);
    if (fact0.ok) assert.equal(fact0.value, 1);

    const pct = evaluateExpression('200 * 15%');
    assert.equal(pct.ok, true);
    if (pct.ok) assert.equal(pct.value, 30);

    const root = evaluateExpression('√(144)');
    assert.equal(root.ok, true);
    if (root.ok) assert.equal(root.value, 12);
  });

  it('rejects domain and syntax edge cases with clear errors', () => {
    const div0 = evaluateExpression('10 / 0');
    assert.equal(div0.ok, false);
    if (!div0.ok) assert.match(div0.error, /divide by zero/i);

    const negSqrt = evaluateExpression('sqrt(-4)');
    assert.equal(negSqrt.ok, false);
    if (!negSqrt.ok) assert.match(negSqrt.error, /negative/i);

    const log0 = evaluateExpression('log(0)');
    assert.equal(log0.ok, false);
    if (!log0.ok) assert.match(log0.error, /positive/i);

    const tan90 = evaluateExpression('tan(90)', 'deg');
    assert.equal(tan90.ok, false);
    if (!tan90.ok) assert.match(tan90.error, /asymptote/i);

    const negFact = evaluateExpression('(-3)!');
    assert.equal(negFact.ok, false);

    const fracFact = evaluateExpression('2.5!');
    assert.equal(fracFact.ok, false);

    const bigFact = evaluateExpression('171!');
    assert.equal(bigFact.ok, false);

    const multiDot = evaluateExpression('1.2.3 + 4');
    assert.equal(multiDot.ok, false);

    const trailingOp = evaluateExpression('5 +');
    assert.equal(trailingOp.ok, false);
  });

  it('formats scientific magnitudes and currency cleanly', () => {
    assert.equal(formatNumber(1e13, { locale: 'en-US' }), '1e+13');
    assert.equal(formatNumber(0.00000012, { locale: 'en-US' }), '1.2e-7');
    assert.equal(formatCurrency(-42.5, '$', 2, 'en-US'), '-$42.50');
    const idr = getCurrencyOption('IDR');
    assert.equal(idr.code, 'IDR');
    assert.equal(formatCurrency(150000, idr.symbol, idr.decimals, 'en-US'), 'Rp 150,000');
  });
});
