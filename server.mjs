import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { handleRequest, secureHeaders } from './auth-core.js';

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

const PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || (PRODUCTION ? '0.0.0.0' : '127.0.0.1');
const env = {
  ...process.env,
  DERIV_REDIRECT_URI: process.env.DERIV_REDIRECT_URI || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/callback` : undefined)
};

function requestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || (PRODUCTION ? 'https' : 'http');
  return `${proto}://${req.headers.host || `localhost:${PORT}`}`;
}

function toRequest(req) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  const init = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') { init.body = Readable.toWeb(req); init.duplex = 'half'; }
  return new Request(new URL(req.url, requestOrigin(req)), init);
}

async function sendResponse(res, response) {
  const headers = {};
  for (const [name, value] of response.headers) if (name !== 'set-cookie') headers[name] = value;
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function route(request) {
  const handled = await handleRequest(request, env);
  if (handled) return handled;
  const { pathname } = new URL(request.url);
  if (request.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    try {
      return new Response(await readFile(join(HERE, 'index.html')), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
    } catch {
      return new Response(JSON.stringify({ error: 'Dashboard file unavailable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
  return new Response(JSON.stringify({ error: 'Not found.' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

const server = createServer(async (req, res) => {
  try {
    await sendResponse(res, secureHeaders(await route(toRequest(req))));
  } catch (error) {
    console.error('[CASPER] request failed:', error);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error.' }));
  }
});

if (!env.DERIV_CLIENT_ID) console.warn('[CASPER] DERIV_CLIENT_ID is not set; login is disabled.');
if (!env.SESSION_ENCRYPTION_KEY || env.SESSION_ENCRYPTION_KEY.length < 32) console.warn('[CASPER] SESSION_ENCRYPTION_KEY (32+ chars) is not set; login is disabled.');
server.listen(PORT, HOST, () => console.log(`CASPER dashboard listening on ${HOST}:${PORT}`));
