# Deriv sign-in and account selection

After Deriv OAuth returns, the server redirects the browser to `/`, which is the trading dashboard.

## Deriv OAuth app

In the Deriv developer dashboard, configure the app's redirect URL to exactly:

`https://YOUR-RENDER-SERVICE.onrender.com/auth/callback`

Use the client ID in Render's `DERIV_CLIENT_ID` environment variable. The app requests the `trade` scope, which enables account-scoped trading APIs when order execution is added. Users choose their Deriv demo or real account explicitly after signing in; the app does not silently choose an account.

## Site owner Premium access

To unlock the Premium strategy controls for your own account, set `CASPER_PREMIUM_OWNER_IDS` in Render's private environment settings to your Deriv account ID. This is the account identifier returned after OAuth, not the OAuth client ID and not an API token. Keep it out of GitHub and chat. Separate multiple owner IDs with commas. Save the setting and redeploy.

## Current implementation boundary

Login, account listing/selection, account balance updates, live public-market scanning, manual quote/buy flow, and the Free/Premium scanner execution pipeline are implemented. Automated cards require an explicit start confirmation, only trade after a qualifying walk-forward screen and live Deriv proposal, and stop on their own target/loss controls or the two-step recovery cap.

The four Premium cards are independent engines. Each owns state for the same 10 target Volatility markets: Volatility 10, 25, 50, 75 and 100, plus their 1-second variants. The cards do not share recovery counters or active-contract state.

Each automated card supports three staking modes: Flat, Tims 1.6 (1.00× → 1.60× → 2.56×), and Tims 2 (1.00× → 2.00× → 4.00×). A win resets to the base stake. A third consecutive loss after the two recovery steps stops that card. The owner allowlist unlocks Premium controls; it does not bypass signal validation, risk controls, or the start confirmation.

Transaction rows are created only after Deriv confirms a purchase and are updated from `proposal_open_contract` until settlement. The transaction panel shows the strategy/card, market, contract, stake, status, P/L, and recovery step so the live feed mirrors the demonstrated workflow.

Do not store a Deriv password, OAuth access token, or personal trading token in this project or in GitHub.
