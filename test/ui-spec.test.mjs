import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('dashboard contains all three trading tiers', () => {
  for (const text of ['Manual Trading', 'Nexora AI Free', 'Nexora AI Premium']) assert.match(html, new RegExp(text));
});

test('Free tier contains four independent strategy cards', () => {
  for (const id of ['rise', 'parity', 'mix', 'smart']) assert.match(html, new RegExp('data-engine="' + id + '"'));
});

test('Premium tier contains four independent strategy cards', () => {
  for (const id of ['matches', 'over8', 'tickstrike', 'autoswitch']) assert.match(html, new RegExp('data-engine="' + id + '"'));
});

test('automated cards expose Flat, Tims 1.6 and Tims 2 modes', () => {
  assert.match(html, /value="flat">Flat/);
  assert.match(html, /value="tims16">Tims 1\.6/);
  assert.match(html, /value="tims2">Tims 2/);
  assert.match(html, /recoveryMultiplier/);
  assert.doesNotMatch(html, /martingaleSteps/);
});

test('transaction panel has the live fields required by the video workflow', () => {
  for (const heading of ['Time', 'Card', 'Market', 'Contract', 'Stake', 'Status', 'Profit / loss']) assert.match(html, new RegExp(heading));
  assert.match(html, /proposal_open_contract/);
  assert.match(html, /Deriv confirmed contract/);
});

test('V5.0.7 uses a fast live-decision screen and continuous retry loop', () => {
  assert.match(html, /MIN_VALIDATION_TESTS=12/);
  assert.match(html, /minimumEntryEdge/);
  assert.match(html, /smartCompositeCandidate/);
  assert.match(html, /Rise\/Fall.*Even\/Odd.*Mix Both/);
  assert.match(html, /sourceStrategy/);
  assert.match(html, /engineBusy=new Set/);
  assert.match(html, /FALLBACK_SCAN_MS=120/);
});

test('each strategy keeps its own state and active contract', () => {
  assert.match(html, /engineState=Object\.fromEntries/);
  assert.match(html, /activeEngineContracts=new Map/);
  assert.match(html, /recoverySteps=new Map/);
});


test('V5.0.10 coalesces live ticks and rejects stale signals', () => {
  assert.match(html, /MAX_SIGNAL_AGE_MS=750/);
  assert.match(html, /EXECUTION_COALESCE_MS=35/);
  assert.match(html, /enginePendingTick/);
  assert.match(html, /skipped tick while executing/);
  assert.match(html, /using newest tick/);
});


test('V5.0.11 keeps quoted payout separate from realized settlement payout', () => {
  assert.match(html, /realizedPayout/);
  assert.match(html, /livePayout/);
  assert.match(html, /Floating P\/L/);
  assert.match(html, /actual payout/);
  assert.match(html, /quotedPayout/);
});
