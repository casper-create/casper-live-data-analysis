import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, seal, unseal, secureHeaders } from '../auth-core.js';

const env = { DERIV_CLIENT_ID: 'abc123', SESSION_ENCRYPTION_KEY: 'x'.repeat(40), CASPER_PREMIUM_OWNER_IDS: 'CR1' };
const call = (path, init = {}, e = env) => handleRequest(new Request('https://example.test' + path, init), e);

test('healthz reports login configuration', async () => {
  assert.deepEqual(await (await call('/healthz')).json(), { ok: true, loginConfigured: true });
  assert.equal((await (await call('/healthz', {}, {})).json()).loginConfigured, false);
});

test('non-auth paths are left to the host', async () => {
  assert.equal(await call('/'), null);
});

test('unconfigured login returns 503, not 404', async () => {
  assert.equal((await call('/auth/login', {}, {})).status, 503);
});

test('login redirects to Deriv with PKCE and sets a Secure state cookie', async () => {
  const res = await call('/auth/login');
  assert.equal(res.status, 303);
  const loc = new URL(res.headers.get('Location'));
  assert.equal(loc.origin + loc.pathname, 'https://auth.deriv.com/oauth2/auth');
  assert.equal(loc.searchParams.get('redirect_uri'), 'https://example.test/auth/callback');
  assert.equal(loc.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(loc.searchParams.get('client_id'), 'abc123');
  const cookie = res.headers.get('Set-Cookie');
  assert.match(cookie, /^__Host-casper_oauth_state=/);
  assert.match(cookie, /HttpOnly; SameSite=Lax; Secure/);
});

test('callback with bad state fails safely', async () => {
  const res = await call('/auth/callback?code=x&state=nope');
  assert.equal(res.status, 303);
  assert.match(res.headers.get('Location'), /login=failed&reason=state/);
});

test('every dashboard route exists (no 404s)', async () => {
  for (const route of ['account', 'account-otp', 'logout']) {
    const res = await call('/auth/' + route, { method: 'POST', headers: { Origin: 'https://example.test' }, body: '{}' });
    assert.notEqual(res.status, 404, route);
  }
  assert.equal((await call('/auth/session')).status, 200);
  assert.equal((await call('/auth/nope')).status, 404);
});

test('POST routes reject foreign origins and missing sessions', async () => {
  const bad = await call('/auth/account-otp', { method: 'POST', headers: { Origin: 'https://evil.test' }, body: '{}' });
  assert.equal(bad.status, 403);
  const anon = await call('/auth/account-otp', { method: 'POST', headers: { Origin: 'https://example.test' }, body: '{"accountId":"A"}' });
  assert.equal(anon.status, 401);
});

test('sealed cookies round-trip and reject tampering or wrong purpose', async () => {
  const sealed = await seal({ a: 1 }, 'session', env);
  assert.deepEqual(await unseal(sealed, 'session', env), { a: 1 });
  assert.equal(await unseal(sealed, 'oauth-state', env), null);
  assert.equal(await unseal(sealed.slice(0, -2) + 'AA', 'session', env), null);
  assert.equal(await unseal(sealed, 'session', { ...env, SESSION_ENCRYPTION_KEY: 'y'.repeat(40) }), null);
});

test('CSP allows the Deriv account websocket host', () => {
  const csp = secureHeaders(new Response('')).headers.get('Content-Security-Policy');
  assert.match(csp, /wss:\/\/api\.derivws\.com/);
});

test('login uses the exact configured redirect URI', async () => {
  const customEnv = { ...env, DERIV_REDIRECT_URI: 'https://trader.example/callback' };
  const res = await call('/auth/login', {}, customEnv);
  const loc = new URL(res.headers.get('Location'));
  assert.equal(loc.searchParams.get('redirect_uri'), 'https://trader.example/callback');
});
