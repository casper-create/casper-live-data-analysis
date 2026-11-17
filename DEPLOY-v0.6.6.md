# Deploy CASPER v0.6.6

1. Stop scanners and allow open contracts to settle.
2. Back up the current deployment.
3. Extract the complete v0.6.6 project ZIP.
4. Run `npm test` and `npm run build`.
5. Deploy the full project using the existing Render or Cloudflare Pages setup.
6. Confirm `/healthz` reports version `0.6.6`.
7. Sign in to a Deriv Demo account and verify the scanner status panel and each card's independent Stop/Reset controls.

There is no global Stop all or Reset selected button in the v0.6.6 transaction drawer.
