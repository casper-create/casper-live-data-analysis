import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('v0.6.2 tracks multiple open contracts per engine and market', () => {
  assert.match(source, /activeEngineContracts=new Map\(\);[^\n]*Set<contractId>/);
  assert.match(source, /activeSet\.add\(t\.id\)/);
  assert.match(source, /activeSet\.delete\(id\)/);
  assert.match(source, /activeCountForEngine\(id\)[\s\S]*?ids instanceof Set\?ids\.size/);
});

test('open contracts do not block the next signal; in-flight pipeline still does', () => {
  assert.match(source, /if\(marketPipelineBusy\(id,symbol\)\)return;/);
  assert.doesNotMatch(source, /if\(hasActiveContract\(id,symbol\)\|\|marketPipelineBusy/);
  assert.doesNotMatch(source, /engine\.activeContract\|\|engine\.inFlight\|\|marketPipelineBusy/);
  assert.match(source, /if\(running\.has\(id\)&&newest&&\(newest\.tickSequence\|\|0\)>signalTickSequence\)/);
});

test('Matches Printer exposes why candidates are gated instead of silently skipping', () => {
  assert.match(source, /function matchesGate\(id,market,reason\)/);
  assert.match(source, /Candidate edge gate:/);
  assert.match(source, /Real-account evidence gate:/);
  assert.match(source, /Conditional digit sample gate:/);
  assert.match(source, /Live Deriv quote rejected:/);
});

test('Matches Printer still requires positive payout-adjusted expected value', () => {
  assert.match(source, /if\(breakEven>=1 \|\| grossProfit<=0 \|\| evObserved<=0\)/);
});
