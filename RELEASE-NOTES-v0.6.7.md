# CASPER v0.6.7 — Reference workflow and risk-math correction

This release is based on the supplied 19.6-second reference video and the user's v0.6.6 project ZIP.

## Changes
- Corrected recovery progression so Tims 1.6 can reach 1.00× → 1.60× → 2.56× and Tims 2 can reach 1.00× → 2.00× → 4.00×. A confirmed win resets to base; after the two configured recovery steps, a third consecutive loss completes the cycle and resets to base.
- Removed silent stake clamping. The full planned stake must fit the remaining loss budget; otherwise the scanner waits for open/pending contracts or stops with the explicit risk-budget reason.
- Corrected remaining-risk arithmetic to follow the configured net-session-P/L stop condition, while reserving the full stake of open contracts and in-flight proposals.
- Added a Sell action to open transaction rows, enabled only when Deriv marks the contract valid to sell. It sends a Deriv sell request at the current available market price and keeps the row open until Deriv's contract stream confirms settlement.
- Updated transaction spot rendering for the current Deriv `entry_spot` / `exit_spot` fields and releases each contract subscription after settlement.
- Kept the live scanner terminal, newest-first confirmed transactions, actual settlement accounting, six transaction KPIs, eight independent cards, and the existing dark CASPER theme.
- Updated app, auth, Worker and build version markers to 0.6.7.

## Important limits
- This release does not copy the reference video's displayed profits, win rate, account balance, or trade speed. Those are not reproducible guarantees.
- The sell action and all automated trading still require live verification on a Deriv Demo account. Passing local tests does not prove live Deriv execution or profitability.
