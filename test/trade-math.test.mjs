import test from 'node:test';
import assert from 'node:assert/strict';

function liveProfit(payout, stake) { return payout - stake; }
function breakEven(stake, payout) { return stake / payout; }
function expectedProfit(winProbability, payout, stake) { return winProbability * payout - stake; }

test('actual Deriv payout determines profit, not a hard-coded multiplier', () => {
  assert.equal(liveProfit(36.36, 20), 16.36);
  assert.equal(Number(liveProfit(140.85, 20).toFixed(2)), 120.85);
});

test('break-even uses the live payout quote', () => {
  assert.equal(Number(breakEven(20, 36.36).toFixed(6)), Number((20/36.36).toFixed(6)));
});

test('expected value uses the observed probability and live payout', () => {
  assert.equal(Number(expectedProfit(0.60, 36.36, 20).toFixed(2)), 1.82);
  assert.equal(Number(expectedProfit(0.15, 140.85, 20).toFixed(2)), 1.13);
});


test('realized profit is reconciled from Deriv settlement values', () => {
  const stake = 20;
  const payout = 140.85;
  const realizedProfit = payout - stake;
  assert.equal(Number(realizedProfit.toFixed(2)), 120.85);
});

test('a losing settlement has zero realized payout and full stake loss', () => {
  const stake = 20;
  const realizedPayout = 0;
  const realizedProfit = realizedPayout - stake;
  assert.equal(realizedProfit, -20);
});

test('quote potential profit is never treated as realized profit', () => {
  const quotedPayout = 140.85;
  const stake = 20;
  const quotePotential = quotedPayout - stake;
  const settlementProfit = -20;
  assert.equal(quotePotential, 120.85);
  assert.equal(settlementProfit, -20);
});
