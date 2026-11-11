## 0.5.20 — NEXORA MACHINE central intelligence

- Introduced a central decision broker supervising all eight specialist cards with explicit ENTER / WAIT / REJECT directives.
- Added live per-market memory for recent tick movement, directional balance, volatility and broad regime classification.
- Added central outcome-learning counters fed by walk-forward forecast results and settled trade feedback.
- Machine authorisation requires a formed specialist signal, minimum validation evidence, a fresh tick and positive expected value from the live Deriv quote; existing card-specific and risk safeguards remain in force.
- Added a NEXORA MACHINE status panel showing live intelligence state, markets observed, cards running and outcomes learned.
- Preserved Auto Switcher's single selected market and Rise/Fall-only behaviour.
- Preserved tick-driven execution: no fixed sleep; 15 ms coalescing, 120 ms recovery retry and 2-second proposal/buy response timeouts remain unchanged. The timeout bounds a stalled request; it is not an intentional delay.
- Each card retains one open contract at a time and resumes immediately after settlement when a fresh qualifying opportunity exists.
- No future-knowledge, accuracy or profit guarantees are claimed.

## 0.5.19 — Premium prediction calibration upgrade

- Improved Matches Printer, Over 8 Killer and parity digit-transition estimates with recency weighting and Bayesian shrinkage toward each market’s unconditional digit distribution.
- Reduced overreaction to small conditional samples; model probabilities are normalized after blending.
- Kept the existing Premium card interfaces, market selection, scan scheduling, quote/buy flow, execution timeouts, and stop controls unchanged.
- No accuracy guarantee: continue to evaluate genuinely out-of-sample forecasts and settled Deriv outcomes.

## 0.5.18 — Independent all-market scanning defaults

- Free and Premium cards now default to independently scanning all 10 supported Volatility markets; users can still pin a card to one market.
- Auto Switcher remains intentionally restricted to one user-selected market.
- Retry scheduling now continues to invoke the decision loop even when no candidate is currently cached, preventing an apparently running card from silently losing its retry path.
- No fixed execution sleep was added; live ticks remain the primary trigger and the bounded fallback remains active.
- Existing risk, quote, expected-value, account validation and stop safeguards are preserved.

# Changelog

## 0.5.15 — Fast tick-to-decision loop and stale-tick correction
- Fixed stale-signal checks to use the local monotonic tick receive timestamp instead of comparing rounded Deriv epoch seconds to wall-clock milliseconds. This removes false stale rejections on fresh ticks.
- Reduced tick coalescing to 15 ms so each card evaluates the newest available tick promptly.
- Kept the existing tick-driven loop and 120 ms fallback retry active for all eight cards.
- Added a 2-second timeout for proposal and buy responses to bound normal scan-to-order waiting. A buy timeout stops that card and requires checking the Deriv portfolio before restart, preventing a blind duplicate buy.
- Preserved each card's existing strategy-specific candidate logic and safety / payout checks; no accuracy threshold was bypassed.


## 0.5.9
- Video-aligned automated test defaults: 20 USD base stake, 200 USD profit target, 50 USD max loss.
- Live proposal payout is now explicitly used for break-even and expected-value validation.
- Automated transactions record the actual Deriv payout and potential profit when a quote is accepted.
- Execution logs show live payout and profit-if-won before BUY.
- No synthetic payout multipliers; actual Deriv proposal values are authoritative.
- Authentication and Manual Trading flow preserved.
- Flat / Tims 1.6 / Tims 2 recovery progression remains bounded.

## 0.5.10
- Tick-driven execution is now coalesced to the newest live tick instead of replaying every tick.
- Signals older than 750 ms are discarded before an automated buy.
- Added per-card skipped-tick accounting and measured signal-to-buy timing.
- Continuous loop resumes from the newest settled/live state without synthetic delays or replayed ticks.
- Fallback retry is 120 ms and is recovery-only; the primary path remains live-tick driven.


## 0.5.11
- Settlement P/L remains authoritative from Deriv `proposal_open_contract.profit`; no forecast or payout estimate overwrites realized profit.
- Captures actual buy price and settlement payout separately from the original quote.
- Open contracts display floating P/L distinctly from settled P/L.
- Settled transactions display the actual Deriv payout and realized P/L.
- Session total payout is reconciled from actual settlement payout, with a safe fallback only when Deriv omits the payout field.
- Quote-time potential profit is kept separate from realized profit.


## 0.5.12 — execution and accounting correction
- Fixed automatic-market execution: Mix Both and Smart AI now evaluate all 10 current market candidates instead of being restricted to the market whose tick happened to trigger the decision timer.
- Automatic-market signals are freshness-checked per candidate market; selected-market cards remain hard-locked to the chosen symbol.
- Fixed settled payout accounting: Deriv `proposal_open_contract.profit` and actual buy price determine realized cash payout (`max(0, buy_price + profit)`). The contract's quoted/potential `payout` field is never counted as cash received after a losing settlement.
- Added per-card Reset Session controls. Reset is blocked while that card has an open contract; prior rows are archived in page memory, while historical forecast/accuracy data is preserved.
- Authentication and Manual Trading request flow unchanged.

## 0.5.13
- Reduced avoidable main-thread work: cache each market/card's latest candidate and rank cached candidates instead of rebuilding price arrays for every decision.
- Batch dashboard/chart rendering to one animation frame while keeping tick-driven decision scheduling immediate.
- Kept the 120 ms recovery fallback bounded (minimum 50 ms for explicit retries); live ticks remain the primary trigger.
- Record and log tick age, live proposal latency, and decision-to-buy latency so scan-to-execution speed is measurable.
- Preserved the Deriv authentication files and existing V5.0.12 trading/risk behaviour.


## 0.5.14 — card-specific accuracy logic
- Implemented distinct decision logic for all eight cards while retaining isolated per-card state and validation.
- Directional cards use multi-window agreement; TickStrike adds an impulse check; Auto Switcher uses its own multi-timeframe filter.
- Digit cards use conditional next-digit transition probabilities, not just recent unconditional digit counts.
- Mix Both and Smart AI rank component strategies using independent walk-forward records.
- Raised the live-entry validation minimum from 12 to 40 outcomes per card/market.
- Preserved the existing interface, authentication, Deriv quote/settlement flow, and tick-driven execution timing.


## 0.5.16 — Transaction quick controls and immediate stop
- Added a Transactions-page control panel listing all eight scanners with per-card Stop buttons, Stop All, and a selected-card session reset.
- Kept the existing scanner-page controls and all existing card layouts.
- Added per-run tokens so a quote response arriving after Stop cannot trigger a new automated buy; stopping invalidates pending decisions and retry timers immediately.
- Open Deriv contracts are not falsely cancelled: they remain monitored until settlement. A buy request already sent to Deriv may still be confirmed by Deriv.
- Kept tick-driven scanning and the bounded market-data fallback loop; no artificial trade-entry sleep was added.

## 0.5.17 — trade-entry warm-up and tick scheduling correction
- Fixed the live tick callback argument mapping so each card's decision timer receives the actual market symbol and tick epoch.
- Removed the 40-observation hard block from demo-account testing: demo scanners can begin qualifying entries after 12 card/market walk-forward outcomes, provided the card-specific live signal and quote economics pass.
- Kept real-account automation behind the full 40-outcome card/market validation gate and positive observed edge.
- Preserved each card's strategy-specific filters, live Deriv proposal/payout checks, balance/loss limits, stop controls, and duplicate-buy protections.
- This is an execution-path correction, not a claim of 80–85% accuracy; demo results must be measured before enabling real-account automation.
