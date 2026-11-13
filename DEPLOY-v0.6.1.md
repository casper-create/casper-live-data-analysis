# Deploy CASPER v0.6.1 — NEXORA MACHINE

## Before replacing the current deployment

1. Stop every running scanner in the current CASPER dashboard.
2. Let all already-open Deriv contracts settle, then verify the Transactions panel.
3. Back up the current repository folder. Do not overwrite the only copy.

## Replace the project

1. Extract the complete `CASPER-Live-Data-Analysis-v0.6.1-NEXORA-MACHINE.zip`.
2. Copy the contents of the extracted project into the existing Git repository, replacing matching files together.
3. Keep your existing Render environment values for `DERIV_CLIENT_ID`, `DERIV_REDIRECT_URI`, and `SESSION_ENCRYPTION_KEY`. Do not publish or share the session key.
4. Commit and push the complete project. Allow Render to deploy the new commit.
5. Open `/healthz` on the deployed site and verify it reports `"version":"0.6.0"` and `"loginConfigured":true`.

## First run

1. Log in with Deriv and select a Demo account.
2. Wait until all ten Volatility markets finish loading and NEXORA reports `LIVE INTELLIGENCE`.
3. Select one card, set a small stake, and check its target and max-loss values.
4. Click **Run selected scanner** once. Its card status should turn green while it scans.
5. Verify that a transaction appears only after Deriv confirms the purchase. Let it settle and verify the actual payout/P&L.
6. Test the other cards individually before running multiple cards together.

## Execution limits to understand

- Live ticks trigger decisions immediately through a microtask queue; there is no fixed 15 ms wait.
- Up to ten quote/buy requests can be in flight concurrently across cards and markets. A card may hold up to ten contracts, at most one on each market; the dashboard caps tracked open positions at twenty total.
- These are software concurrency limits, not a promise of ten confirmed trades per second. Deriv tick frequency, quote availability, API responses, account balance, network latency and platform-side limits determine actual throughput.
- Auto Switcher must have one market selected. It only evaluates Rise and Fall on that market and may choose either direction.
- Flat mode always requests the configured base stake. If the full stake does not fit the remaining loss budget, it skips the trade rather than reducing the stake.
- Stop controls stop new entries. They do not cancel contracts already purchased; those remain open until Deriv settles them unless separately sold.

**Use Demo first. Passing local tests does not prove live profitability, and no trading system can guarantee profits.**
