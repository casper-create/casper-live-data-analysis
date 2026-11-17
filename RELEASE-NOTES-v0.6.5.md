# CASPER v0.6.5 — reference-matched transactions

## Source-video observations

- The 13.77-second reference shows the Deriv Transactions page updating continuously.
- Visible completed-run counts progress from 0 at the beginning to 4 at about 2 seconds, 20 at about 6 seconds, 28 at about 8 seconds, and 30 at about 9.5 seconds.
- The final visible totals are 2,760.00 USD total stake, 8,070.30 USD total payout, 30 wins, 0 losses, and +5,310.30 USD displayed P/L.
- Individual visible transaction rows show 92.00 USD buy price and 177.01 USD payout.
- The 1.07-second second video shows the Nexora AI Premium screen with Matches Printer, Over 8 Killer, TickStrike Pro, Auto Switcher, market selection, stake, profit target, max loss, and a collapsed Transactions drawer.

These are observations from the supplied recordings, not guaranteed trading performance or an execution-speed promise.

## Changes in v0.6.5

- Transactions is now a fixed, collapsible bottom drawer, matching the interaction shown in the second reference video.
- The drawer starts collapsed so the strategy controls remain visible.
- Confirmed purchases are inserted newest-first.
- Transaction rows now show contract type, actual entry/exit spot when supplied by Deriv, buy price, quoted/actual payout, card, market, status, and actual P/L.
- The drawer no longer auto-opens and scrolls the whole page after every buy.
- Total stake counts confirmed purchases; total payout and realized P/L use settled Deriv outcomes only.
- Added an optional one-click launch for all four Premium cards; each card retains its own model, selected market rule, stake settings, and risk stops. Auto Switcher still requires its manually selected market.
- Existing tick-driven strategy scheduling, proposal/buy confirmation, per-card/per-market pipelines, and risk limits are preserved.

## Important limits

The reference recording does not expose its exact strategy decision code, Deriv API timing, or the full set of settings that produced those trades. The video does not establish that 30 trades in 10 seconds or 30 consecutive wins can be reproduced. CASPER continues to use live Deriv quotes and actual settlements; it does not fabricate trades or payouts.
