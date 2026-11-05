# Changelog

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
