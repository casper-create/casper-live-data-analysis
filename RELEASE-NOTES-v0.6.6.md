# CASPER v0.6.6 — video-reference scanner controls

## Reference-derived UI changes

The supplied scanner reference shows a green terminal-style feed behind a “Scanning the market” state with animated activity dots. The transaction drawer now includes a green NEXORA terminal fed by actual application log events (not generated/fake tick output), plus the live scanning state and active-card count.

## Control behaviour

- No global Stop all scanners button.
- No global Reset selected control.
- Each strategy has an individual Stop control.
- Each strategy has an individual Reset control.
- Reset is disabled for a running card or a card with an unsettled Deriv contract.
- Resetting one stopped card cannot reset another card or affect its execution.
- Stopping one card leaves all other running cards untouched.

## Preserved behaviour

The existing eight strategies, 10-market feed, selected-market restrictions, Deriv OAuth, independent execution pipelines, quote/buy flow, risk controls and settlement-driven transaction totals are preserved.

This release changes scanner controls and presentation only. It does not guarantee trade frequency or profitability. Live Deriv Demo verification is still required.
