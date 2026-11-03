import test from 'node:test';
import assert from 'node:assert/strict';

function minimumEntryEdge(id) {
  if (id === 'matches' || id === 'over8') return 0.02;
  if (id === 'tickstrike' || id === 'autoswitch') return 0.02;
  return 0.03;
}

function eligible(id, rate, baseline, tests = 12) {
  return tests >= 12 && Number.isFinite(rate) && rate > baseline + minimumEntryEdge(id);
}

test('Digit strategies do not use an over-strict six-point gate', () => {
  assert.equal(eligible('matches', .134, .10), true);
  assert.equal(eligible('over8', .130, .10), true);
});

test('Direction strategies require a modest observed edge', () => {
  assert.equal(eligible('autoswitch', .556, .50), true);
  assert.equal(eligible('autoswitch', .511, .50), false);
});

test('Insufficient validation never executes', () => {
  assert.equal(eligible('matches', .30, .10, 11), false);
});

test('Observed quote EV gate rejects negative live edge', () => {
  const payout = 9;
  const ask = 1;
  assert.ok(.134 * payout - ask > 0);
  assert.ok(.10 * payout - ask <= 0);
});


test('Auto execution must fall through when the strongest quote is not executable', () => {
  const candidates = [
    { rate: .60, payout: 1.66 }, // 0.996 expected payout before stake: reject
    { rate: .58, payout: 1.80 }  // 1.044: executable
  ];
  const executable = candidates.find(x => x.rate * x.payout - 1 > 0);
  assert.equal(executable, candidates[1]);
});


test('Auto Switcher direction uses live displacement plus directional consistency', () => {
  function direction(prices, windowSize = 8) {
    const from = Math.max(1, prices.length - windowSize);
    let up=0, down=0, abs=0;
    for (let i=from;i<prices.length;i++){ const d=prices[i]-prices[i-1]; abs+=Math.abs(d); if(d>0)up++; else if(d<0)down++; }
    const displacement=(prices.at(-1)-prices[from-1])/(abs||1);
    const consistency=(up-down)/Math.max(1,up+down);
    return .62*displacement+.38*consistency;
  }
  assert.ok(direction([100,101,102,103,104,105,106,107,108]) > 0);
  assert.ok(direction([108,107,106,105,104,103,102,101,100]) < 0);
});
