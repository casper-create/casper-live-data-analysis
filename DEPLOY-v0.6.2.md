# Deploy CASPER v0.6.2 — NEXORA MACHINE

This is a complete project build based on the supplied v0.6.0 project, with the continuous-open-contract tracking and Matches Printer diagnostics updates.

## Before deployment
1. Extract the ZIP.
2. Run `npm install` if dependencies are required by your environment.
3. Run `npm test`.
4. Run `npm run build`.
5. Deploy the generated `dist` output using the existing Cloudflare Pages workflow, or deploy the Node service using the existing Render workflow.

## Important
- Use a Deriv Demo account for initial end-to-end execution checks.
- Matches Printer will display why a candidate is not being bought. A low observed win rate or negative quote-adjusted expected value is not bypassed.
- The build cannot establish profitability. Verify actual Deriv purchases and settlements in Demo before considering any Real-account use.
