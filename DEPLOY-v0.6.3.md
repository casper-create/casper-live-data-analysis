# Deploy CASPER v0.6.3 — NEXORA MACHINE

This release builds on the supplied v0.6.2 WebSocket-hotfix project. It improves socket recovery and trade-loop observability without changing the eight strategy definitions or removing the existing evidence, payout, account, and exposure safeguards.

## Deploy
1. Extract the complete ZIP.
2. Run `npm test` (Node.js 20.6+).
3. Run `npm run build`.
4. Deploy the complete project to the existing Render service, or deploy the generated `dist/` directory to Cloudflare Pages using the existing project workflow.
5. Sign in and select a Deriv Demo account first.
6. Confirm the dashboard reports the public market feed connected and all 10 target markets loaded.
7. Run one card at a time on Demo and confirm a Deriv contract ID appears before enabling more cards.

## What this release changes
- Public WebSocket handshake timeout, heartbeat, stale-feed detection, and exponential reconnect.
- Authenticated WebSocket heartbeat and clearer reconnect diagnostics.
- Proposal and buy response timeouts increased to 8 seconds.
- Run click now reports account-connection progress and evaluates as soon as the authenticated socket is ready and a fresh tick exists.

## Important limitations
- A Run click cannot force Deriv to accept a purchase; the account socket must be authenticated and a fresh qualifying tick and live quote must exist.
- No first-five-wins or profitability guarantee is possible. Test the complete loop on Demo and assess settled outcomes before considering Real funds.
- If the public handshake still times out, the browser/network-to-Deriv route is failing before application code can process market data. This build will log the timeout and retry; it cannot repair an upstream ISP, firewall, VPN, or Deriv edge-network failure.
