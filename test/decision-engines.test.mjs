import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('V0.5.15 defines distinct decision logic for all eight cards', () => {
  for (const fn of ['riseFallCandidate','parityCandidate','mix','smartCompositeCandidate','matchCandidate','over8Candidate','tickStrikeCandidate','autoSwitcherCandidate']) assert.ok(html.includes(fn), `missing ${fn}`);
  assert.match(html, /MIN_VALIDATION_TESTS=12/);
});
test('digit prediction uses conditional next-digit transitions', () => {
  assert.match(html, /function conditionalDigits\(/);
  assert.match(html, /model:"match-transition"/);
  assert.match(html, /model:"over8-transition"/);
  assert.match(html, /model:"parity-transition"/);
});
test('fast cards retain tick-driven scheduling without adding a fixed execution sleep', () => {
  assert.match(html, /function processTick\(/);
  assert.match(html, /scheduleLatestDecision\(id/);
  assert.match(html, /EXECUTION_COALESCE_MS=15/);
  assert.match(html, /FALLBACK_SCAN_MS=120/);
});

test('freshness uses local tick receive time and bounded proposal/buy waits', () => {
  assert.match(html, /function liveTickAgeMs\(/);
  assert.match(html, /MAX_SIGNAL_AGE_MS=5000/);
  assert.match(html, /sendAuthRequest\(req,"proposal",2000\)/);
  assert.match(html, /sendAuthRequest\(req,"buy",2000\)/);
  assert.match(html, /BUY_RESPONSE_TIMEOUT/);
});

test('demo warm-up is enabled while real-account validation remains strict', () => {
  assert.match(html, /REAL_ACCOUNT_VALIDATION_TESTS=40/);
  assert.match(html, /selectedType!=="demo" && \(mt\.n<REAL_ACCOUNT_VALIDATION_TESTS/);
  assert.match(html, /selectedType==="demo"/);
});
test('V0.5.18 defaults all cards to all-market scanning except single-market Auto Switcher', () => {
  assert.match(html, /id==="autoswitch"\?"":"__auto__"/);
  assert.match(html, /id==="autoswitch"\?\(raw==="__auto__"\?"":raw\):\(raw\|\|"__auto__"\)/);
  assert.match(html, /Automatic — scan all 10 markets/);
});
test('V0.5.18 fallback retry continues even when no candidate is cached', () => {
  assert.match(html, /const latest=best\?best\.market:Array\.from\(markets\.values\(\)\)/);
  assert.match(html, /scheduleLatestDecision\(id,null,latest\?latest\.symbol:null,latest\?latest\.epoch\|\|0:0\)/);
});
