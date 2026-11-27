import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const auth = fs.readFileSync(new URL('../auth-core.js', import.meta.url), 'utf8');
const worker = fs.readFileSync(new URL('../worker.js', import.meta.url), 'utf8');

test('v0.6.6 aligns runtime and UI defaults at $1 stake / $10 target / $10 max loss', () => {
  assert.match(html, /engineConfig=new Map\(engineIds\.map\(function\(id\)\{return \[id,\{stake:1,target:10,maxLoss:10,stakeMode:"flat"\}\]\}\)\)/);
  assert.match(html, /id="premiumStake"[^>]*value="1"/);
  assert.match(html, /id="premiumTarget"[^>]*value="10"/);
  assert.match(html, /id="premiumMaxLoss"[^>]*value="10"/);
});

test('Flat stake is not silently reduced; exhausted risk stops with a visible reason', () => {
  assert.ok(html.includes('settings.stakeMode==="flat"?"Flat":"recovery"'));
  assert.match(html, /Risk budget cannot support the next full/);
  assert.match(html, /remaining loss allowance/);
  assert.match(html, /enginePauseReason\.set\(id,reason\)/);
  assert.match(html, /enginePauseReason\.get\(id\)/);
});

test('Auto Switcher dashboard candidate is restricted to its manually selected market', () => {
  assert.match(html, /function bestFor\(id\)\{const choice=engineMarketChoice\.get\(id\);if\(choice===""\)return null;const source=choice&&choice!=="__auto__"\?\[markets\.get\(choice\)\]:Array\.from\(markets\.values\(\)\)/);
  assert.match(html, /Select one Volatility market; adapt Rise\/Fall direction to its live ticks/);
});

test('v0.6.6 exposes the actual paused/risk reason instead of a false generic RUNNING state', () => {
  assert.match(html, /Running · "\+enginePauseReason\.get\(id\)/);
  assert.match(html, /Paused/);
  assert.match(html, /max loss reached\|risk budget cannot support/);
});

test('all app and auth surfaces identify v0.6.6', () => {
  assert.match(html, /APP_VERSION="0\.6\.7"/);
  assert.match(auth, /APP_VERSION = '0\.6\.7'/);
  assert.match(worker, /APP_VERSION = '0\.6\.7'/);
});
