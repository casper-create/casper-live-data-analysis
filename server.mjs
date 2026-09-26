import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
// Load a local .env file when present. Hosted services provide their own env vars.
try {
  const localEnv = await readFile(join(HERE, '.env'), 'utf8');
  for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const CLIENT_ID = process.env.DERIV_CLIENT_ID;
const REDIRECT_URI = process.env.DERIV_REDIRECT_URI || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/callback` : undefined);
const PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_TTL = 8 * 60 * 60 * 1000;
const LOGIN_TTL = 10 * 60 * 1000;
const sessions = new Map();
const logins = new Map();
const cookieName = PRODUCTION ? '__Host-casper_sid' : 'casper_sid';
const stateCookie = PRODUCTION ? '__Host-casper_oauth_state' : 'casper_oauth_state';

function configError() {
  if (!CLIENT_ID || !REDIRECT_URI) return 'Set DERIV_CLIENT_ID and DERIV_REDIRECT_URI before starting the server.';
  let callback;
  try { callback = new URL(REDIRECT_URI); } catch { return 'DERIV_REDIRECT_URI must be a valid absolute URL.'; }
  if (callback.pathname !== '/auth/callback' || callback.search || callback.hash) return 'DERIV_REDIRECT_URI must end exactly with /auth/callback.';
  if (PRODUCTION && callback.protocol !== 'https:') return 'Production OAuth callback URLs must use HTTPS.';
  return null;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function readCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setCookie(res, name, value, maxAge, httpOnly = true) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax'];
  if (httpOnly) parts.push('HttpOnly');
  if (PRODUCTION) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax', 'HttpOnly'];
  if (PRODUCTION) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

function redirect(res, url, cookies = []) {
  res.writeHead(303, { Location: url, 'Cache-Control': 'no-store', 'Set-Cookie': cookies });
  res.end();
}

function getSession(req) {
  const sid = readCookies(req)[cookieName];
  const session = sid && sessions.get(sid);
  if (!session) return null;
  if (session.expiresAt <= Date.now() || session.tokenExpiresAt <= Date.now()) {
    sessions.delete(sid);
    return null;
  }
  return { sid, session };
}

function normalizeAccounts(payload) {
  const raw = payload?.data;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.accounts) ? raw.accounts : raw ? [raw] : [];
  return list.map(a => ({
    id: a.account_id || a.accountId || a.id || '',
    type: String(a.account_type || a.type || '').toLowerCase(),
    currency: a.currency || 'USD',
    balance: typeof a.balance === 'number' ? a.balance : null,
    status: a.status || ''
  })).filter(a => a.id && a.status !== 'disabled');
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

const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://auth.deriv.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.derivws.com wss://ws.derivws.com");
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/healthz') return send(res, 200, { ok: true });
  if (url.pathname.startsWith('/auth/') && configError()) return send(res, 503, { error: 'Deriv login is not configured on this server.' });

  if (req.method === 'GET' && url.pathname === '/auth/login') {
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    logins.set(state, { verifier, createdAt: Date.now() });
    const auth = new URL('https://auth.deriv.com/oauth2/auth');
    auth.search = new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, scope: 'trade', state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
    setCookie(res, stateCookie, state, Math.floor(LOGIN_TTL / 1000));
    res.writeHead(302, { Location: auth.href, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/auth/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookies = readCookies(req);
    const pending = state && logins.get(state);
    logins.delete(state);
    const clearState = `${stateCookie}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly${PRODUCTION ? '; Secure' : ''}`;
    if (url.searchParams.has('error') || !code || !pending || pending.createdAt + LOGIN_TTL < Date.now() || !safeEqual(state, cookies[stateCookie])) {
      return redirect(res, '/?login=failed', [clearState]);
    }
    try {
      const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, code_verifier: pending.verifier, redirect_uri: REDIRECT_URI }),
        signal: AbortSignal.timeout(15000)
      });
      const token = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || typeof token.access_token !== 'string' || !Number.isFinite(token.expires_in)) return redirect(res, '/?login=failed', [clearState]);
      const sid = randomBytes(32).toString('base64url');
      sessions.set(sid, { accessToken: token.access_token, tokenExpiresAt: Date.now() + token.expires_in * 1000, expiresAt: Date.now() + SESSION_TTL, accounts: [], activeAccountId: null });
      const sessionCookie = `${cookieName}=${encodeURIComponent(sid)}; Path=/; Max-Age=${Math.floor(Math.min(SESSION_TTL, token.expires_in * 1000) / 1000)}; SameSite=Lax; HttpOnly${PRODUCTION ? '; Secure' : ''}`;
      return redirect(res, '/', [clearState, sessionCookie]);
    } catch {
      return redirect(res, '/?login=failed', [clearState]);
    }
  }

  if (req.method === 'GET' && url.pathname === '/auth/session') {
    const current = getSession(req);
    if (!current) return send(res, 200, { authenticated: false });
    try {
      current.session.accounts = await getAccounts(current.session);
      if (!current.session.activeAccountId || !current.session.accounts.some(a => a.id === current.session.activeAccountId)) {
        const demo = current.session.accounts.find(a => a.type === 'demo');
        current.session.activeAccountId = demo?.id || current.session.accounts[0]?.id || null;
      }
      const account = current.session.accounts.find(a => a.id === current.session.activeAccountId) || null;
      return send(res, 200, { authenticated: true, accounts: current.session.accounts, activeAccountId: current.session.activeAccountId, activeAccount: account });
    } catch (error) {
      sessions.delete(current.sid);
      clearCookie(res, cookieName);
      return send(res, 401, { authenticated: false, error: error.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/auth/logout') {
    const origin = req.headers.origin;
    const expectedOrigin = new URL(REDIRECT_URI).origin;
    if (!origin || origin !== expectedOrigin) return send(res, 403, { error: 'Request origin rejected.' });
    const sid = readCookies(req)[cookieName];
    if (sid) sessions.delete(sid);
    clearCookie(res, cookieName);
    return send(res, 200, { ok: true });
  }

  if (req.method === 'POST' && url.pathname === '/auth/account') {
    const origin = req.headers.origin;
    if (!origin || origin !== new URL(REDIRECT_URI).origin) return send(res, 403, { error: 'Request origin rejected.' });
    const current = getSession(req);
    if (!current) return send(res, 401, { error: 'Sign in again.' });
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 2048) return send(res, 413, { error: 'Request too large.' }); }
    let parsed;
    try { parsed = JSON.parse(body); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    if (!current.session.accounts.some(a => a.id === parsed.accountId)) return send(res, 400, { error: 'That account is not available in this session.' });
    current.session.activeAccountId = parsed.accountId;
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const html = await readFile(join(HERE, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(html);
    } catch { return send(res, 500, { error: 'Dashboard file unavailable.' }); }
  }
  send(res, 404, { error: 'Not found.' });
});

const problem = configError();
if (problem) console.warn(`[CASPER] ${problem}`);
server.listen(PORT, HOST, () => console.log(`CASPER dashboard listening on ${HOST}:${PORT}`));

setInterval(() => {
  const now = Date.now();
  for (const [state, login] of logins) if (login.createdAt + LOGIN_TTL < now) logins.delete(state);
  for (const [sid, session] of sessions) if (session.expiresAt <= now || session.tokenExpiresAt <= now) sessions.delete(sid);
}, 60_000).unref();
