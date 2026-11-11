# CASPER Live Data Analysis — v0.5.21

Dashboard with Deriv OAuth login. One shared auth module (`auth-core.js`) runs on both hosts, so Render and Cloudflare cannot drift apart again:

- `server.mjs`: Node server (Render, or local development)
- `VERSION.txt`: explicit build marker so every V5 bundle is easy to identify
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

## NEXORA MACHINE — central intelligence layer (v0.5.20)

- Observes incoming Deriv ticks across the supported Volatility markets and maintains bounded per-market memory (recent movement, directional balance, volatility and broad regime label).
- Supervises all eight specialist cards through a shared ENTER / WAIT / REJECT decision broker. Specialist strategy definitions remain independent; Auto Switcher stays pinned to one selected market and only chooses Rise or Fall.
- Uses the specialist forecast, walk-forward evidence, current tick freshness and the live Deriv quote's payout-adjusted expected value before authorising an entry. Existing card-specific validation, account checks, stop limits and duplicate-order protections remain authoritative.
- Learns from walk-forward forecast outcomes and keeps a compact per-card/per-market outcome history in this browser (no Deriv tokens or account credentials are stored in this memory). Market tick telemetry is maintained live; the machine does not claim to know future ticks or guarantee profits.
- No artificial two-second execution delay is added. The existing 15 ms tick coalescing, 120 ms recovery retry and bounded 2-second Deriv proposal/buy response timeouts remain. The two-second timeout is a failure bound, not a wait before buying.
- One open contract per card is retained; after settlement, the card immediately resumes from the newest available signal, subject to fresh quote and risk validation.

## Behaviour notes

- After login, a **demo** account is selected by default; a real account is only active after you choose it.
- A Deriv outage does not end your session. Only an expired or rejected token does.
- If login fails, the dashboard shows why (cancelled, expired, rejected by Deriv, network).
- Automated cards are enabled only after explicit user confirmation, live Deriv quote validation, and the configured target/max-loss checks. Orders are real Deriv purchases only; there are no simulated transaction rows.
- The current testing warm-up requires 40 observed validation results before a card can qualify a trade. This is a testing threshold, not an accuracy guarantee.
- V4-compatible Deriv OAuth/session behavior is intentionally preserved in `auth-core.js`. Do not replace it with a different login implementation.


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


## V5.0.1 change control

This bundle is intentionally delivered as a complete project, not a partial file patch. Replace the matching repository files together so GitHub Desktop sees the actual content changes as one coherent version. The login module remains the V4-compatible OAuth implementation.

### Automated card behavior

- Rise / Fall and Even / Odd use the selected Volatility market.
- Mix Both and Smart AI can choose automatically from all 10 target Volatility markets.
- Premium cards are available to a signed-in account for testing; owner-ID gating only controls the owner label.
- Each card owns its own recovery counter, P/L, active contract, validation state and stop limits.
- A completed losing trade advances Flat/Tims 1.6/Tims 2 recovery as configured, capped at two recovery steps; a win resets to base.
- After settlement, a running card is scheduled to look for the next qualifying trade until its target, max-loss or safety condition stops it.
- Transactions are created only after Deriv confirms the purchase and are updated from `proposal_open_contract` until settlement.

### Change-control rule

When a new version is prepared, the assistant will provide the full project ZIP and the version marker. Do not mix individual files from different versions, especially `auth-core.js`, `server.mjs`, `build-pages.mjs`, and `index.html`.


## V5.0.9 video-aligned math
Automated cards use the actual Deriv proposal payout for break-even, expected-value and realized-profit calculations. No synthetic payout multiplier is used. The default automated test profile is 20 USD base stake, 200 USD profit target and 50 USD max loss; users can change these before starting. Video results are examples and are not guarantees.


## V5.0.12 execution corrections
- Mix Both and Smart AI use a global 10-market candidate ranking. The tick that wakes the scheduler no longer limits the eligible market list.
- Candidate freshness is validated against each candidate's own market timestamp. Selected-market strategies remain restricted to the user's chosen market.
- Settled cash payout is derived from the actual Deriv buy price plus realized contract profit, not the proposal's potential payout field.
- Reset Session stops the selected card, refuses to reset while a contract is open, archives that card's session trades in the current page session, and preserves its historical forecast accuracy.

## V5.0.13 execution timing and responsiveness
V5.0.13 keeps live ticks as the primary scanner trigger. It caches each market/card's latest candidate, batches visual refreshes to one animation frame, and keeps a bounded 120 ms recovery check while live ticks remain the primary trigger. It records tick age, proposal latency, and decision-to-buy latency for each automated purchase. These measurements do not imply that every signal will be executable or profitable; Deriv quote availability, network latency, contract rules, and risk gates still apply.
