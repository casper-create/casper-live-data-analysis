# Changelog

## 0.5.3
- Smart AI now evaluates Rise/Fall, Even/Odd and Mix Both across all 10 Volatility markets and chooses the strongest qualifying market/mode automatically.
- Smart AI keeps its own observed-result accuracy state while using the three Free strategy engines as its live signal sources.
- Preserved immediate signal-to-proposal-to-buy execution and continuous post-settlement scanning.
- Added explicit recovery mathematics verification for Flat, Tims 1.6 and Tims 2.


## 0.5.2
- Preserved the V4-compatible Deriv OAuth/login flow unchanged.
- Removed artificial entry delays in the automated scanners: a qualifying live signal requests a Deriv proposal immediately.
- Serialized automated execution per card so one card cannot create duplicate simultaneous buys from the same live tick.
- Triggered the next qualifying scan immediately after a confirmed contract settles instead of waiting for a long retry interval.
- Added a fast observed-accuracy entry screen (12 observed forecasts plus a minimum 6-point edge over baseline) while keeping the final live quote/break-even check.
- Added visible per-card accuracy to all 8 strategy cards.
- Smart AI remains fully automatic: it scans all 10 Volatility markets and automatically selects the strongest qualifying market and contract mode.
- Accuracy remains based on observed Deriv tick outcomes; no synthetic/fake trades or accuracy guarantees are used.

## 0.5.4
- Removed the universal six-point entry gate; digit strategies now use a strategy-appropriate observed edge.
- Live execution now validates observed walk-forward rate against the live Deriv quote break-even instead of requiring the conservative Wilson lower bound to exceed break-even.
- Auto-market ranking uses observed accuracy edge with confidence weighting.
- Reduced fallback scan retry to 100 ms; normal entry remains tick-driven and settlement-driven.
- Added automated tests for entry eligibility and live quote EV.


## 0.5.5 — execution supervisor fix
- Ranked execution now tries the strongest eligible candidate and immediately falls through to the next qualifying candidate when a live quote is not executable.
- Auto-switching cards no longer get stuck on one rejected quote while displaying Running.
- Selected-market cards retain their market binding.
- Preserved live proposal/buy, settlement, recovery and risk gates.
- Preserved V4-compatible authentication.
