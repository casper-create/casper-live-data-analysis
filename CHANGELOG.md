# Changelog

## 0.5.7
- Unified all automated cards around the Auto Switcher live-decision workflow while preserving each strategy’s contract logic.
- Every automated card now requires observed walk-forward edge plus a current live signal edge before proposal.
- Added live market-state context (RISING/FALLING/FLAT) to automated decision logs.
- Digit and parity strategies now carry live trend context into their decision engine.
- Tick-driven execution remains primary; 25 ms fallback is safety-only.
- Continuous settlement -> recovery -> rescan loop retained.
- Manual Trading remains unchanged.
- V4-compatible Deriv authentication remains unchanged.
