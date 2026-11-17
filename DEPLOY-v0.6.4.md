# Deploy CASPER v0.6.4 — NEXORA MACHINE

This release corrects the runtime/UI stake mismatch and misleading scanner state observed in the v0.6.3 live dashboard.

## Before deployment

1. Stop all scanners. Let any already-purchased Deriv contracts settle.
2. Download and extract the complete v0.6.4 project.
3. Preserve the existing Render environment variables: `DERIV_CLIENT_ID`, `DERIV_REDIRECT_URI`, `SESSION_ENCRYPTION_KEY`, and `CASPER_PREMIUM_OWNER_IDS`.
4. Deploy the complete project directory, not only `index.html`.

## Verify locally

```bash
npm test
npm run build
npm start
```

The automated suite should report 84 passing tests. The build creates Cloudflare Pages output in `dist/`.

## Verify the deployed release

Open `/healthz` and confirm the response reports `"version":"0.6.4"` and `"loginConfigured":true`.

Then use a Deriv Demo account first. Confirm the UI defaults are $1 base stake, $10 target, and $10 max loss. Run one card and inspect its activity log, Deriv-confirmed transaction, and settlement. Do not switch to a Real account until the public feed, authenticated account socket, proposal, buy confirmation, and settlement have all been observed working.

## Important

The default risk settings are conservative starting values, not a profit promise. A scanner stops if the remaining max-loss budget cannot support the full Flat stake. This is intentional and is now displayed clearly rather than leaving the card falsely marked RUNNING. No strategy guarantees consecutive wins or continuous purchases when no qualifying positive-EV signal exists.
