# Changelog

## 0.5.1
- Preserved the V4-compatible Deriv OAuth/session flow.
- Added explicit build/version markers across the project.
- Updated documentation so automation behavior matches the current code.
- Reduced the automated-card validation warm-up to 40 observed outcomes for testing; this is not an accuracy guarantee.
- Kept selected-market routing for non-Smart/non-Mix cards and automatic market selection for Smart AI/Mix Both.
- Kept Flat, Tims 1.6 and Tims 2 recovery capped at two recovery steps.
- Kept transactions tied to confirmed Deriv purchases and settlement updates.
- Kept target, max-loss, balance and quote checks active.
