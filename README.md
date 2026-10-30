# CASPER Live Data Analysis

Dashboard with Deriv OAuth login. One shared auth module (`auth-core.js`) runs on both hosts, so Render and Cloudflare cannot drift apart again:

- `server.mjs`: Node server (Render, or local development)
- `build-pages.mjs`: builds `dist/` for Cloudflare Pages, assembling `_worker.js` from `auth-core.js`

Sessions are stateless: an AES-GCM encrypted HttpOnly cookie. Nothing is kept on the server, so restarts, sleeping instances and redeploys do not log anyone out. The Deriv access token never reaches page JavaScript.

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `DERIV_CLIENT_ID` | yes | Your Deriv OAuth app client ID |
| `SESSION_ENCRYPTION_KEY` | yes | 32+ random characters. Keep it secret and keep it the same across deploys (changing it signs everyone out). `render.yaml` generates one automatically on Render. |
| `DERIV_REDIRECT_URI` | no | Only for custom domains. Defaults to the address the site is served on. |
| `CASPER_PREMIUM_OWNER_IDS` | no | Comma-separated Deriv account IDs that unlock Premium UI |

Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

Register this exact callback in your Deriv OAuth app: `https://YOUR-ADDRESS/auth/callback`

## Deploy on Render

1. **New → Blueprint**, connect the repo. Enter `DERIV_CLIENT_ID` when prompted (the session key is generated for you).
2. Register `https://YOUR-SERVICE.onrender.com/auth/callback` in the Deriv app.
3. Open `https://YOUR-SERVICE.onrender.com/healthz`. It should show `"loginConfigured":true`.

The free plan sleeps after 15 minutes idle and takes about a minute to wake; logins survive this. Upgrade before relying on it for continuous live monitoring.

## Deploy on Cloudflare Pages

1. Create a Pages project from the repo. **Build command** `npm run build`, **Output directory** `dist`.
2. Add `DERIV_CLIENT_ID` (variable) and `SESSION_ENCRYPTION_KEY` (secret), then redeploy.
3. Register `https://YOUR-PROJECT.pages.dev/auth/callback` in the Deriv app and check `/healthz`.

GitHub Pages cannot run the login routes; use Render or Cloudflare.

## Local development

Node 20.6+. Copy `env.example` to `.env`, fill it in, register `http://127.0.0.1:8080/auth/callback`, then `npm start`.

`npm test` runs the smoke tests (routes exist, PKCE redirect, origin checks, cookie encryption).

## Behaviour notes

- After login, a **demo** account is selected by default; a real account is only active after you choose it.
- A Deriv outage does not end your session. Only an expired or rejected token does.
- If login fails, the dashboard shows why (cancelled, expired, rejected by Deriv, network).
- Order automation stays disabled; no accuracy or profit rate is claimed. See `LOGIN-SETUP.md`.


## Recovery modes

Every scanner has its own isolated recovery state and can scan the 10 target Volatility markets independently. The selected staking mode is one of:

- **Flat:** base stake on every trade.
- **Tims 1.6:** base → 1.60× base → 2.56× base, then capped.
- **Tims 2:** base → 2.00× base → 4.00× base, then capped.

A win resets the engine to base stake. A scanner stops at its configured profit target, max-loss limit, insufficient balance, or invalid/unusable Deriv quote. No mode is presented as a profit guarantee.

## Premium scanner architecture

The four Premium cards — Matches Printer, Over 8 Killer, TickStrike Pro, and Auto Switcher — are independent strategy engines. Each card receives the full set of 10 Volatility markets (Volatility 10/25/50/75/100, regular and 1-second variants) and maintains its own signal state, validation metrics, open-contract state, recovery counter, target, and max-loss controls. Multiple cards may run concurrently on the same authenticated account.


## Nexora tier architecture

### Manual Trading
Live chart and the target Volatility markets with manual quote/confirm/buy flow.

### Nexora AI Free
Four independent strategy engines: Rise / Fall, Even / Odd, Mix Both, and Smart AI. Each engine maintains its own ten-market analysis state.

### Nexora AI Premium
Four independent strategy engines: Matches Printer, Over 8 Killer, TickStrike Pro, and Auto Switcher. Each engine maintains its own ten-market analysis state, active contract, P/L, recovery counter, and risk limits.

### Staking
Flat, Tims 1.6, or Tims 2. Recovery is capped at two recovery steps and resets to base after a win.

### Transactions
The live transaction feed records only confirmed Deriv purchases and updates them from the authenticated `proposal_open_contract` stream until settlement.
