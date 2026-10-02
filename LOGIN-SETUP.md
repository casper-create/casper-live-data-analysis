# Deriv sign-in and account selection

This project is deployed as a Render Node.js web service. After Deriv OAuth returns, the server redirects the browser to `/`, which is the trading dashboard.

## Deriv OAuth app

In the Deriv developer dashboard, configure the app's redirect URL to exactly:

`https://YOUR-RENDER-SERVICE.onrender.com/auth/callback`

Use the client ID in Render's `DERIV_CLIENT_ID` environment variable. The app requests the `trade` scope, which enables account-scoped trading APIs when order execution is added. Users choose their Deriv demo or real account explicitly after signing in; the app does not silently choose an account.

## Site owner Premium access

To unlock the Premium strategy controls for your own account, set `CASPER_PREMIUM_OWNER_IDS` in Render's private environment settings to your Deriv account ID. This is the account identifier returned after OAuth, not the OAuth client ID and not an API token. Keep it out of GitHub and chat. Separate multiple owner IDs with commas. Save the setting and redeploy.

## Current implementation boundary

Login, account listing/selection, and account balance updates are implemented. The four Premium cards have separate strategy roles, but their signal filters and execution are not complete or accuracy-validated. Order placement remains disabled. The owner allowlist unlocks the Premium controls for this account; it does not bypass validation or start trades.

Do not store a Deriv password, OAuth access token, or personal trading token in this project or in GitHub.
