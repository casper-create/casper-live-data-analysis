// Shared Deriv OAuth + session logic. Web-standard APIs only (Request, Response, crypto.subtle, fetch),
// so the exact same code runs in Node 20+ (server.mjs) and in a Cloudflare Worker (_worker.js).
// Sessions are stateless: an AES-GCM encrypted HttpOnly cookie. Nothing is stored on the server,
// so restarts, sleeping instances and multiple instances never log anyone out.

const SESSION_TTL = 8 * 60 * 60; // seconds
const LOGIN_TTL = 10 * 60; // seconds
const MAX_BODY = 2048;
const encoder = new TextEncoder();
const keyCache = new Map();

function b64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

function randomString(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

async function encryptionKey(env) {
  const secret = env.SESSION_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('SESSION_ENCRYPTION_KEY must be at least 32 characters.');
  if (!keyCache.has(secret)) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
    keyCache.set(secret, await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']));
  }
  return keyCache.get(secret);
}

export async function seal(value, purpose, env) {
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

export async function unseal(value, purpose, env) {
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

// The public origin is what Deriv redirects back to. DERIV_REDIRECT_URI wins when set (custom domains,
// proxies); otherwise it is taken from the request itself.
function publicOrigin(request, env) {
  if (env.DERIV_REDIRECT_URI) {
    try { return new URL(env.DERIV_REDIRECT_URI).origin; } catch { /* fall through */ }
  }
  return new URL(request.url).origin;
}

function callbackUri(request, env) {
  if (env.DERIV_REDIRECT_URI) {
    try {
      const configured = new URL(env.DERIV_REDIRECT_URI);
      if (configured.protocol !== 'https:' && !(configured.protocol === 'http:' && configured.hostname === 'localhost')) {
        throw new Error('DERIV_REDIRECT_URI must use HTTPS in production.');
      }
      return configured.href;
    } catch (error) {
      if (error.message.includes('HTTPS')) throw error;
    }
  }
  return `${publicOrigin(request, env)}/auth/callback`;
}

function cookieNames(origin) {
  // The __Host- prefix requires Secure, which browsers refuse over plain http (local development).
  return origin.startsWith('https:')
    ? { session: '__Host-casper_sid', state: '__Host-casper_oauth_state', secure: true }
    : { session: 'casper_sid', state: 'casper_oauth_state', secure: false };
}

function readCookie(request, name) {
  for (const item of (request.headers.get('Cookie') || '').split(';')) {
    const index = item.indexOf('=');
    if (index < 0 || item.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(item.slice(index + 1).trim()); } catch { return null; }
  }
  return null;
}

function makeCookie(names, name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${names.secure ? '; Secure' : ''}`;
}

function json(data, status = 200, cookies = []) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  for (const item of cookies) headers.append('Set-Cookie', item);
  return new Response(JSON.stringify(data), { status, headers });
}

function redirect(url, cookies = []) {
  const headers = new Headers({ Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  for (const item of cookies) headers.append('Set-Cookie', item);
  return new Response(null, { status: 303, headers });
}

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
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

class AuthExpired extends Error {}

async function getAccounts(session) {
  const response = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
    headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) throw new AuthExpired('Deriv session expired. Sign in again.');
  if (!response.ok) throw new Error('Could not load Deriv accounts. Try again shortly.');
  return normalizeAccounts(body);
}

async function readSession(request, env, names) {
  const session = await unseal(readCookie(request, names.session), 'session', env);
  if (!session || !session.accessToken || session.expiresAt <= Date.now()) return null;
  return session;
}

async function readJsonBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return { error: json({ error: 'Request too large.' }, 413) };
  try { return { body: JSON.parse(text) }; } catch { return { error: json({ error: 'Invalid request.' }, 400) }; }
}

function configured(env) {
  return Boolean(env.DERIV_CLIENT_ID) && typeof env.SESSION_ENCRYPTION_KEY === 'string' && env.SESSION_ENCRYPTION_KEY.length >= 32;
}

function premiumIds(env) {
  return new Set((env.CASPER_PREMIUM_OWNER_IDS || '').split(',').map(id => id.trim()).filter(Boolean));
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const route = url.pathname.slice('/auth/'.length).replace(/\/+$/, '');
  const origin = publicOrigin(request, env);
  const redirectUri = callbackUri(request, env);
  const names = cookieNames(origin);

  if (!configured(env)) {
    return json({ error: 'Deriv login is not configured. Set DERIV_CLIENT_ID and SESSION_ENCRYPTION_KEY (32+ characters).' }, 503);
  }

  if (request.method === 'GET' && route === 'login') {
    const state = randomString(32);
    const verifier = randomString(48);
    const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
    const auth = new URL('https://auth.deriv.com/oauth2/auth');
    auth.search = new URLSearchParams({
      response_type: 'code', client_id: env.DERIV_CLIENT_ID, redirect_uri: redirectUri,
      scope: 'trade', state, code_challenge: challenge, code_challenge_method: 'S256'
    }).toString();
    const pending = await seal({ state, verifier, expiresAt: Date.now() + LOGIN_TTL * 1000 }, 'oauth-state', env);
    return redirect(auth.href, [makeCookie(names, names.state, pending, LOGIN_TTL)]);
  }

  if (request.method === 'GET' && route === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const pending = await unseal(readCookie(request, names.state), 'oauth-state', env);
    const clearState = makeCookie(names, names.state, '', 0);
    if (url.searchParams.has('error')) return redirect('/?login=failed&reason=denied', [clearState]);
    if (!code || !pending || pending.expiresAt < Date.now() || !constantTimeEqual(state, pending.state)) {
      return redirect('/?login=failed&reason=state', [clearState]);
    }
    try {
      const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', client_id: env.DERIV_CLIENT_ID,
          code, code_verifier: pending.verifier, redirect_uri: redirectUri
        }),
        signal: AbortSignal.timeout(15000)
      });
      const token = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || typeof token.access_token !== 'string' || !Number.isFinite(token.expires_in)) {
        return redirect('/?login=failed&reason=token', [clearState]);
      }
      const seconds = Math.max(1, Math.min(SESSION_TTL, Math.floor(token.expires_in)));
      const session = await seal({ accessToken: token.access_token, expiresAt: Date.now() + seconds * 1000, activeAccountId: null }, 'session', env);
      return redirect('/', [clearState, makeCookie(names, names.session, session, seconds)]);
    } catch {
      return redirect('/?login=failed&reason=network', [clearState]);
    }
  }

  if (request.method === 'GET' && route === 'session') {
    const session = await readSession(request, env, names);
    if (!session) return json({ authenticated: false }, 200, readCookie(request, names.session) ? [makeCookie(names, names.session, '', 0)] : []);
    try {
      const accounts = await getAccounts(session);
      if (!session.activeAccountId || !accounts.some(account => account.id === session.activeAccountId)) {
        // Default to a demo account so a real account is never active without an explicit choice.
        session.activeAccountId = accounts.find(account => account.type === 'demo')?.id || null;
      }
      const activeAccount = accounts.find(account => account.id === session.activeAccountId) || null;
      const remaining = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
      const premiumOwner = accounts.some(account => premiumIds(env).has(account.id));
      return json({ authenticated: true, accounts, activeAccountId: session.activeAccountId, activeAccount, premiumOwner }, 200,
        [makeCookie(names, names.session, await seal(session, 'session', env), remaining)]);
    } catch (error) {
      // Only an expired/rejected token ends the session; a Deriv outage must not log people out.
      if (error instanceof AuthExpired) return json({ authenticated: false, error: error.message }, 401, [makeCookie(names, names.session, '', 0)]);
      return json({ authenticated: true, error: error.message }, 502);
    }
  }

  if (request.method === 'POST' && ['logout', 'account', 'account-otp'].includes(route)) {
    if (request.headers.get('Origin') !== origin) return json({ error: 'Request origin rejected.' }, 403);
    if (route === 'logout') return json({ ok: true }, 200, [makeCookie(names, names.session, '', 0)]);

    const session = await readSession(request, env, names);
    if (!session) return json({ error: 'Sign in again.' }, 401);
    const parsed = await readJsonBody(request);
    if (parsed.error) return parsed.error;
    const accountId = parsed.body?.accountId;
    if (typeof accountId !== 'string' || accountId.length > 64) return json({ error: 'Invalid account.' }, 400);

    try {
      const accounts = await getAccounts(session);
      const account = accounts.find(item => item.id === accountId);
      if (!account) return json({ error: 'That account is not available in this session.' }, 400);

      if (route === 'account') {
        session.activeAccountId = account.id;
        const remaining = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
        return json({ ok: true }, 200, [makeCookie(names, names.session, await seal(session, 'session', env), remaining)]);
      }

      const response = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${encodeURIComponent(account.id)}/otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      const payload = await response.json().catch(() => ({}));
      const wsUrl = payload?.data?.url;
      if (!response.ok || typeof wsUrl !== 'string') return json({ error: 'Could not open the selected Deriv account connection.' }, response.status === 401 ? 401 : 502);
      const ws = new URL(wsUrl);
      if (ws.protocol !== 'wss:' || ws.hostname !== 'api.derivws.com' || !ws.pathname.startsWith('/trading/v1/options/ws/')) {
        return json({ error: 'Deriv returned an invalid account connection URL.' }, 502);
      }
      return json({ url: ws.href, accountType: account.type });
    } catch (error) {
      if (error instanceof AuthExpired) return json({ error: error.message }, 401, [makeCookie(names, names.session, '', 0)]);
      return json({ error: 'Could not reach Deriv. Try again shortly.' }, 502);
    }
  }

  return json({ error: 'Not found.' }, 404);
}

// Returns a Response for /healthz and /auth/*, or null for everything else (the host serves static files).
export async function handleRequest(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === '/healthz') return json({ ok: true, loginConfigured: configured(env) });
  if (pathname.startsWith('/auth/')) return handleAuth(request, env);
  return null;
}

export function secureHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://auth.deriv.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.derivws.com wss://api.derivws.com");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
