const SESSION_COOKIE = '__Host-casper_sid';
const STATE_COOKIE = '__Host-casper_oauth_state';
const SESSION_TTL = 8 * 60 * 60;
const LOGIN_TTL = 10 * 60;
const encoder = new TextEncoder();

function b64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

function randomString(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

async function encryptionKey(env) {
  if (!env.SESSION_ENCRYPTION_KEY || env.SESSION_ENCRYPTION_KEY.length < 32) {
    throw new Error('Set SESSION_ENCRYPTION_KEY in the Cloudflare project settings (at least 32 characters).');
  }
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(env.SESSION_ENCRYPTION_KEY));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function seal(value, purpose, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(purpose) },
    await encryptionKey(env),
    encoder.encode(JSON.stringify(value))
  );
  const bytes = new Uint8Array(iv.length + encrypted.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(encrypted), iv.length);
  return b64url(bytes);
}

async function unseal(value, purpose, env) {
  if (!value) return null;
  try {
    const bytes = fromB64url(value);
    if (bytes.length < 29) return null;
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: encoder.encode(purpose) },
      await encryptionKey(env),
      bytes.slice(12)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  for (const item of (request.headers.get('Cookie') || '').split(';')) {
    const index = item.indexOf('=');
    if (index < 0 || item.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(item.slice(index + 1).trim()); } catch { return null; }
  }
  return null;
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(name) {
  return cookie(name, '', 0);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

function redirect(url, cookies = []) {
  const headers = new Headers({ Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  for (const item of cookies) headers.append('Set-Cookie', item);
  return new Response(null, { status: 303, headers });
}

function sameOrigin(request) {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

function normalizeAccounts(payload) {
  const raw = payload?.data;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.accounts) ? raw.accounts : raw ? [raw] : [];
  return list.map(account => ({
    id: account.account_id || account.accountId || account.id || '',
    type: String(account.account_type || account.type || '').toLowerCase(),
    currency: account.currency || 'USD',
    balance: typeof account.balance === 'number' ? account.balance : null,
    status: account.status || ''
  })).filter(account => account.id && account.status !== 'disabled');
}

async function readSession(request, env) {
  const session = await unseal(readCookie(request, SESSION_COOKIE), 'session', env);
  if (!session || !session.accessToken || session.expiresAt <= Date.now()) return null;
  return session;
}

async function getAccounts(session) {
  const response = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
    headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? 'Deriv session expired. Sign in again.' : 'Could not load Deriv accounts. Try again shortly.');
  return normalizeAccounts(body);
}

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const route = url.pathname.slice('/auth/'.length).replace(/\/+$/, '');

  if (!env.DERIV_CLIENT_ID || !env.SESSION_ENCRYPTION_KEY) {
    return json({ error: 'Deriv login needs configuration in Cloudflare project settings.' }, 503);
  }

  if (request.method === 'GET' && route === 'login') {
    const state = randomString(32);
    const verifier = randomString(48);
    const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
    const callback = new URL('/auth/callback', url.origin).href;
    const auth = new URL('https://auth.deriv.com/oauth2/auth');
    auth.search = new URLSearchParams({
      response_type: 'code', client_id: env.DERIV_CLIENT_ID, redirect_uri: callback,
      scope: 'trade', state, code_challenge: challenge, code_challenge_method: 'S256'
    }).toString();
    const stateCookie = await seal({ state, verifier, expiresAt: Date.now() + LOGIN_TTL * 1000 }, 'oauth-state', env);
    return redirect(auth.href, [cookie(STATE_COOKIE, stateCookie, LOGIN_TTL)]);
  }

  if (request.method === 'GET' && route === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const pending = await unseal(readCookie(request, STATE_COOKIE), 'oauth-state', env);
    const clearState = clearCookie(STATE_COOKIE);
    if (url.searchParams.has('error') || !code || !pending || pending.expiresAt < Date.now() || !constantTimeEqual(state, pending.state)) {
      return redirect('/?login=failed', [clearState]);
    }
    const callback = new URL('/auth/callback', url.origin).href;
    try {
      const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', client_id: env.DERIV_CLIENT_ID,
          code, code_verifier: pending.verifier, redirect_uri: callback
        }),
        signal: AbortSignal.timeout(15000)
      });
      const token = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || typeof token.access_token !== 'string' || !Number.isFinite(token.expires_in)) {
        return redirect('/?login=failed', [clearState]);
      }
      const sessionSeconds = Math.min(SESSION_TTL, token.expires_in);
      const session = await seal({
        accessToken: token.access_token,
        expiresAt: Date.now() + sessionSeconds * 1000,
        activeAccountId: null
      }, 'session', env);
      return redirect('/', [clearState, cookie(SESSION_COOKIE, session, sessionSeconds)]);
    } catch {
      return redirect('/?login=failed', [clearState]);
    }
  }

  if (request.method === 'GET' && route === 'session') {
    const session = await readSession(request, env);
    if (!session) return json({ authenticated: false }, 200, { 'Set-Cookie': clearCookie(SESSION_COOKIE) });
    try {
      const accounts = await getAccounts(session);
      if (!session.activeAccountId || !accounts.some(account => account.id === session.activeAccountId)) {
        session.activeAccountId = accounts.find(account => account.type === 'demo')?.id || accounts[0]?.id || null;
      }
      const activeAccount = accounts.find(account => account.id === session.activeAccountId) || null;
      const remaining = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
      const updatedSession = await seal(session, 'session', env);
      return json({ authenticated: true, accounts, activeAccountId: session.activeAccountId, activeAccount }, 200,
        { 'Set-Cookie': cookie(SESSION_COOKIE, updatedSession, remaining) });
    } catch (error) {
      return json({ authenticated: false, error: error.message }, 401, { 'Set-Cookie': clearCookie(SESSION_COOKIE) });
    }
  }

  if (request.method === 'POST' && (route === 'logout' || route === 'account')) {
    if (!sameOrigin(request)) return json({ error: 'Request origin rejected.' }, 403);
    if (route === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(SESSION_COOKIE) });

    const session = await readSession(request, env);
    if (!session) return json({ error: 'Sign in again.' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
    if (typeof body.accountId !== 'string' || body.accountId.length > 64) return json({ error: 'Invalid account.' }, 400);
    try {
      const accounts = await getAccounts(session);
      if (!accounts.some(account => account.id === body.accountId)) return json({ error: 'That account is not available in this session.' }, 400);
      session.activeAccountId = body.accountId;
      const remaining = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, await seal(session, 'session', env), remaining) });
    } catch (error) {
      return json({ error: error.message }, 401, { 'Set-Cookie': clearCookie(SESSION_COOKIE) });
    }
  }

  return json({ error: 'Not found.' }, 404);
}

function secureHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://auth.deriv.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.derivws.com wss://ws.derivws.com");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = url.pathname.startsWith('/auth/')
      ? await handleAuth(request, env)
      : await env.ASSETS.fetch(request);
    return secureHeaders(response);
  }
};