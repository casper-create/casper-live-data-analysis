# Deploy CASPER v0.6.5

1. Stop all scanners and wait for open Deriv contracts to settle.
2. Back up the currently deployed project and environment variables.
3. Extract the complete v0.6.5 ZIP.
4. Run `npm test` and `npm run build`.
5. Deploy the complete project using the existing Render/Cloudflare setup and preserve the existing Deriv OAuth callback and secrets.
6. Confirm `/healthz` reports version `0.6.5`.
7. Sign in to a Deriv Demo account first. Confirm the public market feed is live and all 10 target markets have loaded history.
8. Start one strategy at a time and inspect the Transactions drawer. Confirm each row has a Deriv contract ID in the browser's application state, an actual buy price, and settlement updates from `proposal_open_contract`.
9. Only after successful Demo verification should you consider any Real-account use.

Do not change Deriv client IDs, OAuth secrets, account permissions, or callback URLs as part of this deployment.
