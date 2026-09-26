# Deriv OAuth setup

The production app runs as a Cloudflare Pages Advanced Mode Worker. Its callback shares the same HTTPS origin as the dashboard, so browser requests use same-origin cookies.

## Values you need

1. A Deriv OAuth app's **client ID**.
2. Your Cloudflare Pages production host, such as `casper-site.pages.dev`.
3. A unique random `SESSION_ENCRYPTION_KEY` with at least 32 characters. Create it privately and add it only as a Cloudflare secret.

Do not send passwords, Deriv access tokens, or the encryption key in chat. The Deriv client ID belongs in Cloudflare's project settings, not in `index.html`.

## Exact callback

After the first Cloudflare deployment, register this exact URL in the Deriv OAuth app:

`https://YOUR-PAGES-HOST/auth/callback`

For example, if Cloudflare gives you `casper-site.pages.dev`, register `https://casper-site.pages.dev/auth/callback`. The host must be the same address where people will open the login page. If you later use a custom domain, add that domain's callback to Deriv and redeploy/reconfigure as needed.

## Cloudflare variables

In the Cloudflare Pages project, open **Settings → Variables and Secrets** and set these for the **Production** environment:

- `DERIV_CLIENT_ID`: the client ID from your registered Deriv OAuth app.
- `SESSION_ENCRYPTION_KEY`: your unique random value, stored as a secret.

Redeploy after saving the values. The callback URL is derived from the incoming Cloudflare Pages hostname, so no redirect URL variable is required.

## Security behavior

- OAuth Authorization Code with PKCE/S256 and a short-lived, encrypted state cookie.
- State is checked on the callback; account and logout POST requests must come from the same site origin.
- The Deriv access token is encrypted with AES-GCM and stored only in a Secure, HttpOnly, SameSite=Lax cookie. JavaScript cannot read it.
- Session cookies expire no later than the Deriv token or eight hours.
- Only the `trade` scope is requested, and the demo account is selected first when available.

For local development, the separate Node server uses a local `.env` file and callback `http://127.0.0.1:8080/auth/callback`.
