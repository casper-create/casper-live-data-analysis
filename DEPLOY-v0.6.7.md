# Deploy CASPER v0.6.7

1. Stop automated scanners and let all open Deriv contracts settle before replacing the project.
2. Back up the currently deployed project and environment variables.
3. Extract the complete v0.6.7 ZIP.
4. Run `npm test` and `npm run build` from the project folder.
5. Deploy the complete project to the existing Render or Cloudflare Pages service.
6. Confirm `/healthz` reports version `0.6.7`.
7. Sign in to a Deriv Demo account. Verify scanner start/stop, full Flat/Tims stake sizing, open-contract risk reservation, Sell confirmation, and final settlement totals before considering any real-account use.

Do not use a real account to test the Sell control or recovery progression. The reference video's results are not a promise of future performance.
