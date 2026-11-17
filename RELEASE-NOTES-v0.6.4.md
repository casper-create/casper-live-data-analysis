# CASPER v0.6.4 — execution-state and risk-budget correction

## Corrected
- Aligned the JavaScript runtime configuration with the visible stake controls: $1 base stake, $10 profit target, and $10 max-loss default for every card. Previously the runtime silently initialized to $20 / $200 / $50 while the HTML displayed $1 / $10 / $10 (Free) or $1 / $20 / $20 (Premium). This mismatch explains why the screenshot showed a $20 stake despite the form markup showing $1.
- A Flat card now stops with a clear reason when its remaining loss budget cannot support the full configured stake and there are no open or pending contracts that could settle and release reserved exposure. It no longer remains misleadingly labelled RUNNING while every next entry is rejected.
- If exposure is temporarily reserved by open/pending contracts, the scanner reports that it is waiting for settlement instead of stopping prematurely.
- The selected-scanner panel now shows the real wait/paused reason.
- Auto Switcher dashboard candidate selection now respects its manually selected single market, matching its execution restriction.
- Updated session-result handling for risk-budget stops.

## Preserved
- All eight independent specialist engines, ten-market feed, Deriv OAuth, WebSocket reconnect/heartbeat, proposal/buy/settlement flow, multiple-open-contract tracking, payout-adjusted EV checks, and account/exposure safeguards.
- No artificial execution delay was added. No entry filters were bypassed to force trades.

## Verification boundary
- Automated tests and production build verify local code behavior only. Live Deriv connection, quote acceptance, purchase confirmation, settlement behavior, and profitability must still be verified on a Deriv Demo account. No profit sequence is guaranteed.
