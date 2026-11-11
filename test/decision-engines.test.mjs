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
  assert.match(html, /model:"match-transition-shrunk"/);
  assert.match(html, /model:"over8-transition-shrunk"/);
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

test('V0.5.19 digit models use recency weighting and shrinkage instead of raw tiny-sample rates', () => {
  assert.match(html, /const halfLife=/);
  assert.match(html, /const reliability=conditionalWeight\/\(conditionalWeight\+90\)/);
  assert.match(html, /globalProbabilities:globalP/);
  assert.match(html, /model:"match-transition-shrunk"/);
  assert.match(html, /model:"over8-transition-shrunk"/);
});

test('V0.5.19 preserves execution scheduling and bounded Deriv request waits', () => {
  assert.match(html, /EXECUTION_COALESCE_MS=15/);
  assert.match(html, /FALLBACK_SCAN_MS=120/);
  assert.match(html, /sendAuthRequest\(req,"proposal",2000\)/);
  assert.match(html, /sendAuthRequest\(req,"buy",2000\)/);
});


test('V0.5.20 installs the central NEXORA MACHINE decision broker and live memory', () => {
  assert.match(html, /NEXORA MACHINE/);
  assert.match(html, /function machineObserveTick\(/);
  assert.match(html, /function machineAuthorise\(/);
  assert.match(html, /function machineLearnOutcome\(/);
  assert.match(html, /machineAuthorise\(id,best\.market,c,mt,observedRate,evObserved\)/);
  assert.match(html, /outcomeMemory:loadMachineOutcomeMemory\(\)/);
  assert.match(html, /machineRecord\("WAIT"/);
});

test('V0.5.20 keeps immediate tick-driven execution and does not add a two-second sleep', () => {
  assert.match(html, /EXECUTION_COALESCE_MS=15/);
  assert.match(html, /FALLBACK_SCAN_MS=120/);
  assert.match(html, /sendAuthRequest\(req,"proposal",2000\)/);
  assert.match(html, /sendAuthRequest\(req,"buy",2000\)/);
  assert.doesNotMatch(html, /setTimeout\([^;]{0,100},\s*2000\s*\)/);
});

test('Auto Switcher remains Rise/Fall-only and market-pinned', () => {
  assert.match(html, /function autoSwitcherCandidate\(/);
  assert.match(html, /engineMarketChoice\.get\(id\)/);
  assert.match(html, /if\(choice!=="__auto__"&&symbol&&choice!==symbol\)return/);
  assert.match(html, /contractType:side==="up"\?"CALL":"PUT"/);
});

test('V0.5.21 seeds NEXORA market memory from already-loaded Deriv history', () => {
  assert.match(html, /function seedMachineFromHistory\(m\)/);
  assert.match(html, /m\.historyReady=true;seedMachineFromHistory\(m\);rebuildTests\(m\)/);
  assert.match(html, /machineObserveTick\(m,m\.ticks\[i\]\.quote,i\?m\.ticks\[i-1\]\.quote:null\)/);
});

test('V0.5.21 Run Bot starts in one click after account and risk checks', () => {
  const start = html.slice(html.indexOf('async function startEngine(id)'), html.indexOf('function scheduleLatestDecision'));
  assert.match(start, /if\(!signedIn\|\|!selectedAccount\)/);
  assert.match(start, /settings\.maxLoss/);
  assert.match(start, /await activateEngine\(id\)/);
  assert.doesNotMatch(start, /confirmOverlay/);
});
