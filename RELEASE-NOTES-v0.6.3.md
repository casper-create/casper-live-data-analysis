# CASPER v0.6.3 — NEXORA MACHINE

## What changed

- Public Deriv WebSocket handshake now has a 10-second timeout. A stalled handshake is closed and retried with exponential backoff and jitter.
- Public feed sends 25-second keepalive pings and checks for a silent/stale connection.
- Authenticated Deriv account socket sends 25-second keepalive pings and reports unexpected closure.
- Proposal and buy response waits are now 8 seconds instead of 2 seconds. A buy timeout still stops that card to prevent a blind duplicate purchase.
- Run requests show account-connection progress, then activate the card's independent tick-driven scanner immediately after account connection.
- All eight cards now report their main WAIT/REJECT reasons in the activity log and central NEXORA status instead of silently skipping several strategy gates.
- All eight strategies, all ten Volatility markets, card-specific logic, open-contract tracking, payout checks, risk limits, and manual trading are retained.

## Verification performed

- `npm test`: 79 passed, 0 failed.
- `npm run build`: passed.
- JavaScript syntax checks: passed for the dashboard script, worker, auth module, server and build script.
- ZIP integrity: verified after packaging.

## What is not claimed

- No live Deriv WebSocket handshake or live purchase was possible to verify in this build environment.
- No guarantee can be made that the first five trades, or any set of trades, will be profitable. The machine will not force entries or fabricate wins.
- The WebSocket reconnect logic can recover from transient failures; it cannot repair a network/ISP/firewall route that cannot reach Deriv's WebSocket edge.
