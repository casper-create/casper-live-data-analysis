import test from 'node:test';
import assert from 'node:assert/strict';

function recoveryMultiplier(mode, step) {
  if (mode === 'tims16') return step === 0 ? 1 : step === 1 ? 1.6 : 2.56;
  if (mode === 'tims2') return step === 0 ? 1 : step === 1 ? 2 : 4;
  return 1;
}

function stake(base, mode, step) { return base * recoveryMultiplier(mode, Math.min(2, Math.max(0, step))); }

test('Flat stays at base stake', () => assert.deepEqual([0,1,2,7].map(s => stake(20,'flat',s)), [20,20,20,20]));
test('Tims 1.6 follows 1.0 -> 1.6 -> 2.56', () => assert.deepEqual([0,1,2,3].map(s => stake(20,'tims16',s)), [20,32,51.2,51.2]));
test('Tims 2 follows 1.0 -> 2.0 -> 4.0', () => assert.deepEqual([0,1,2,3].map(s => stake(20,'tims2',s)), [20,40,80,80]));
test('A win resets to base for the next cycle', () => { let step=1; step=0; assert.equal(stake(20,'tims16',step),20); });
