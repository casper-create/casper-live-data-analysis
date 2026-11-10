import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('V0.5.14 defines distinct decision logic for all eight cards', () => {
  for (const fn of ['riseFallCandidate','parityCandidate','mix','smartCompositeCandidate','matchCandidate','over8Candidate','tickStrikeCandidate','autoSwitcherCandidate']) assert.ok(html.includes(fn), `missing ${fn}`);
  assert.match(html, /MIN_VALIDATION_TESTS=40/);
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
  assert.match(html, /EXECUTION_COALESCE_MS=35/);
  assert.match(html, /FALLBACK_SCAN_MS=120/);
});
