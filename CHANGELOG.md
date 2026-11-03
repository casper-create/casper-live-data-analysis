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
