import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const worker = fs.readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
const auth = fs.readFileSync(new URL('../auth-core.js', import.meta.url), 'utf8');

test('v0.6.6 detects public WebSocket opening-handshake timeouts', () => {
  assert.match(html, /PUBLIC_OPEN_TIMEOUT_MS=10000/);
  assert.match(html, /opening handshake timed out after/);
  assert.match(html, /function schedulePublicReconnect\(/);
});

test('v0.6.6 public market feed uses heartbeat, stale-feed detection and bounded exponential reconnect', () => {
  assert.match(html, /SOCKET_HEARTBEAT_MS=25000/);
  assert.match(html, /PUBLIC_STALE_TIMEOUT_MS=25000/);
  assert.match(html, /Math\.pow\(2,Math\.min\(publicRetryAttempt,5\)\)/);
  assert.match(html, /no server messages for/);
  assert.match(html, /JSON\.stringify\(\{ping:1\}\)/);
});

test('v0.6.6 authenticated socket sends keepalive and reports unexpected closure', () => {
  assert.match(html, /authHeartbeatTimer=setInterval/);
  assert.match(html, /Authenticated Deriv socket closed/);
  assert.match(html, /Deriv account connection closed before opening/);
});

test('v0.6.6 gives proposal and buy requests bounded but realistic response windows', () => {
  assert.match(html, /sendAuthRequest\(req,"proposal",8000\)/);
  assert.match(html, /sendAuthRequest\(req,"buy",8000\)/);
  assert.match(html, /BUY_RESPONSE_TIMEOUT/);
});

test('v0.6.6 does not claim or hardcode first-five trade profits', () => {
  assert.doesNotMatch(html, /firstFiveWins|guaranteedProfit|forceWinningTrade/i);
  assert.match(html, /No strategy can guarantee accuracy or profit/);
});

test('all deployed version markers identify v0.6.6', () => {
  assert.match(html, /APP_VERSION="0\.6\.6"/);
  assert.match(auth, /APP_VERSION = '0\.6\.6'/);
  assert.match(worker, /APP_VERSION = '0\.6\.6'/);
});

test('v0.6.6 reports wait/reject reasons for all eight cards instead of silently skipping gates', () => {
  assert.match(html, /function engineGate\(id,market,reason,command\)/);
  for (const reason of [
    'Waiting for sufficient live tick history',
    'walk-forward forecasts',
    'Real-account evidence gate',
    'Candidate edge gate',
    'Rise/Fall requires agreement',
    'Even/Odd requires at least 25',
    'Mix Both has no valid component',
    'Smart AI has no scored specialist',
    'Over 8 requires at least 25',
    'TickStrike is waiting',
    'Auto Switcher requires stronger'
  ]) assert.ok(html.includes(reason), `missing diagnostic: ${reason}`);
});
