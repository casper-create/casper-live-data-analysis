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
  for (const heading of ['Time', 'Type', 'Entry / Exit spot', 'Buy price / Payout', 'Card / Market', 'Status', 'Profit / loss']) assert.match(html, new RegExp(heading));
  assert.match(html, /proposal_open_contract/);
  assert.match(html, /Deriv confirmed contract/);
});

test('V5.0.7 uses a fast live-decision screen and continuous retry loop', () => {
  assert.match(html, /MIN_VALIDATION_TESTS=12/);
  assert.match(html, /minimumEntryEdge/);
  assert.match(html, /smartCompositeCandidate/);
  assert.match(html, /Rise\/Fall.*Even\/Odd.*Mix Both/);
  assert.match(html, /sourceStrategy/);
  assert.match(html, /engineBusyMarkets=new Set/);
  assert.match(html, /FALLBACK_SCAN_MS=250/);
});

test('each strategy keeps its own state and active contract', () => {
  assert.match(html, /engineState=Object\.fromEntries/);
  assert.match(html, /activeEngineContracts=new Map/);
  assert.match(html, /recoverySteps=new Map/);
});


test('V5.0.10 coalesces live ticks and rejects stale signals', () => {
  assert.match(html, /MAX_SIGNAL_AGE_MS=5000/);
  assert.match(html, /EXECUTION_COALESCE_MS=0/);
  assert.match(html, /enginePendingTick/);
  assert.match(html, /coalesced superseded tick/);
  assert.match(html, /using newest/);
});


test('V5.0.11 keeps quoted payout separate from realized settlement payout', () => {
  assert.match(html, /realizedPayout/);
  assert.match(html, /livePayout/);
  assert.match(html, /Live P\/L/);
  assert.match(html, /actual payout/);
  assert.match(html, /quotedPayout/);
});


test('V5.0.12 automatic market decisions are not restricted to the triggering tick market', () => {
  assert.match(html, /Each market has its own pipeline/);
  assert.match(html, /const candidates=\[\{market:currentMarket,candidate:localCandidate/);
  assert.match(html, /candidateAgeMs>MAX_SIGNAL_AGE_MS/);
});

test('V5.0.12 reset controls preserve forecast history and refuse open-contract resets', () => {
  assert.match(html, /id="freeReset"/);
  assert.match(html, /id="premiumReset"/);
  assert.match(html, /Cannot reset .* while a Deriv contract is still open/);
  assert.match(html, /archivedTrades\.push/);
  assert.match(html, /Forecast history and accuracy were preserved/);
});

test('V5.0.12 settled cash payout is derived from actual buy price and realized profit', () => {
  assert.match(html, /t\.realizedPayout=Math\.max\(0,Number\(t\.stake\)\+Number\(t\.profit\|\|0\)\)/);
  assert.doesNotMatch(html, /if\(Number\.isFinite\(livePayout\)\) t\.realizedPayout=livePayout/);
});

test('V5.0.13 keeps retry intervals bounded', () => {
  assert.match(html, /const FALLBACK_SCAN_MS=250/);
  assert.match(html, /Number\.isFinite\(delay\)\?Math\.max\(50,delay\):FALLBACK_SCAN_MS/);
});

test('V5.0.13 ranks cached live candidates rather than recalculating every market on each decision', () => {
  assert.match(html, /function currentCandidate\(id,symbol\).*?metricsFor\(id,symbol\)\.latest/);
  assert.match(html, /Cache the current live candidate once/);
});

test('V5.0.13 batches visual updates to one animation frame', () => {
  assert.match(html, /if\(!renderQueued\)\{renderQueued=true;if\(window\.requestAnimationFrame\)/);
  assert.doesNotMatch(html, /renderChart\(\);renderQueued=true;renderQueued=false/);
});

test('V5.0.13 measures tick age, proposal latency and decision-to-buy latency', () => {
  for (const field of ['tickAgeMs', 'quoteMs', 'decisionToBuyMs']) assert.match(html, new RegExp(field));
  assert.match(html, /timing · tick age/);
});


test('v0.6.6 scanner controls match the reference: live scan state and isolated per-card controls', () => {
  assert.match(html, /id="txScanTitle"/);
  assert.match(html, /Scanning the market/);
  assert.match(html, /id="txEngineControls"/);
  assert.match(html, /data-tx-stop=/);
  assert.match(html, /data-tx-reset=/);
  assert.doesNotMatch(html, /id="stopAllEngines"/);
  assert.doesNotMatch(html, /id="txResetSelected"/);
  assert.doesNotMatch(html, /id="txResetEngine"/);
  assert.match(html, /Each card is controlled independently/);
});

test('V0.5.16 invalidates in-flight quote decisions after a scanner is stopped', () => {
  assert.match(html, /engineRunTokens=new Map/);
  assert.match(html, /bumpEngineRunToken\(id\);running\.delete\(id\)/);
  assert.match(html, /engineRunTokens\.get\(id\)\|\|0\)!==runToken/);
  assert.match(html, /payload\.runToken/);
});

test('v0.6.6 per-card reset never silently stops an active scanner', () => {
  assert.match(html, /Stop .* individually before resetting its session/);
  assert.match(html, /open Deriv contracts continue to settlement/i);
  assert.doesNotMatch(html, /function stopAllEngines/);
});


test('v0.6.5 transaction drawer follows the supplied reference interaction', () => {
  assert.match(html, /<section class="card collapsed" id="transactions">/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /#transactions\.collapsed \.transaction-kpis/);
  assert.match(html, /#transactions\.collapsed \.transaction-list/);
  assert.match(html, /position:fixed/);
  assert.match(html, /newest first/);
  assert.match(html, /entry_tick_display_value/);
  assert.match(html, /exit_tick_display_value/);
  assert.match(html, /trades\.unshift\(t\)/);
  assert.match(html, /function renderTransactions\(\)/);
  assert.doesNotMatch(html, /openTransactionPanel\(true\);sendAuth\(\{proposal_open_contract/);
});

test('v0.6.5 transaction totals use confirmed buys and settled Deriv payout only', () => {
  assert.match(html, /const totalStake=trades\.reduce/);
  assert.match(html, /const totalPayout=closed\.reduce/);
  assert.match(html, /Number\.isFinite\(Number\(t\.realizedPayout\)\)\?Number\(t\.realizedPayout\):0/);
  assert.match(html, /t\.realizedPayout=Math\.max\(0,Number\(t\.stake\)\+Number\(t\.profit\|\|0\)\)/);
});


test('v0.6.5 can start the four Premium cards together through separate strategy pipelines', () => {
  assert.match(html, /id="premiumRunAll"/);
  assert.match(html, /function beginEngineNow\(id\)/);
  assert.match(html, /async function activateEngines\(ids\)/);
  assert.match(html, /const ids=\["matches","over8","tickstrike","autoswitch"\]/);
  assert.match(html, /Each keeps its own model, market pipelines and risk limits/);
  assert.match(html, /combined base stakes exceed available unreserved balance/);
});


test('v0.6.6 scanner reference includes a live green terminal fed by real application log events', () => {
  assert.match(html, /id="txTerminalLines"/);
  assert.match(html, /NEXORA LIVE SCAN FEED/);
  assert.match(html, /terminal\.prepend\(line\)/);
  assert.match(html, /LIVE SCANNING/);
});
