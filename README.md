# CASPER Live Data Analysis

Reference-based dashboard with Deriv OAuth login, implemented as a Cloudflare Pages Advanced Mode Worker.

## What is included

- The screenshot-based dashboard in `index.html`.
- Cloudflare Worker routes for Deriv login, callback, session, account selection, and sign-out.
- OAuth Authorization Code + PKCE, state validation, origin checks, and encrypted HttpOnly session cookies.
- A build script that packages the dashboard and Worker entry file for deployment.
- The original Node server for local development.

GitHub Pages can still show the static preview, but it cannot run the authentication functions. Use the Cloudflare Pages `pages.dev` address for Deriv login.

## Deploy on Render

This repository includes a Node.js server in `server.mjs` that serves the dashboard and handles Deriv OAuth on the same host. `render.yaml` configures a Render Web Service using `npm start`, a `/healthz` health check, and a dashboard prompt for the Deriv OAuth client ID. The server reads Render's `RENDER_EXTERNAL_URL` to build its callback URL.

1. In Render, choose **New → Blueprint** and connect this GitHub repository.
2. During setup, enter the Deriv OAuth app's client ID when prompted for `DERIV_CLIENT_ID`.
3. Deploy the Blueprint. Render provides the service URL, for example `https://casper-live-data-analysis.onrender.com`.
4. In the Deriv OAuth app settings, set the exact callback to `https://YOUR-RENDER-ADDRESS/auth/callback`.
5. Open the Render service URL and choose **Login with Deriv**.
6. To grant your own Deriv account free Premium UI access, open the Render service's **Environment** settings and set `CASPER_PREMIUM_OWNER_IDS` to your Deriv account ID (the account ID, not OAuth client ID or API token). Keep it private, then save and redeploy. Multiple owner account IDs can be comma-separated.

The free Render instance is for checking the deployment and OAuth flow. It can sleep after 15 minutes without traffic and take about a minute to wake, so upgrade the service before relying on it for continuous live monitoring. The current Node server keeps login sessions in memory; a service restart requires signing in again.

## Deploy to Cloudflare Pages

1. Make sure the files in this folder are in the root of the GitHub repository, including `worker.js`, `build-pages.mjs`, `package.json`, and `index.html`.
2. In Cloudflare, create a **Pages** project and connect the GitHub repository.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`. Leave the root directory as `/`. The build places the Worker entry file at `dist/_worker.js`; Cloudflare uses it to serve the page and handle `/auth/*` requests.
4. Deploy once. Copy the production `pages.dev` address Cloudflare gives you.
5. Register a Deriv OAuth app with this exact callback: `https://YOUR-PAGES-ADDRESS/auth/callback`.
6. In Cloudflare Pages **Settings → Variables and Secrets**, add `DERIV_CLIENT_ID` as a production variable. Add `SESSION_ENCRYPTION_KEY` as a production secret, using a unique random value of at least 32 characters. Do not put that key in GitHub or send it in chat.
7. Redeploy, open the Cloudflare Pages address, and choose **Login with Deriv**.

The app requests the Deriv `trade` scope. After sign-in, choose the account explicitly; the app does not silently select a demo or real account. It reads each account's balance over its authenticated Deriv connection. The access token stays server-side in an HttpOnly session cookie and is never sent to page JavaScript. The site-owner Premium allowlist is server configuration, not a browser-side switch.

Premium cards currently describe distinct strategy roles. Automated order placement remains disabled while their signal rules, payout/edge checks, and risk controls are being built and validated. No accuracy or profit rate is claimed by this build.

## Local development

Use Node.js 20.6 or newer. Copy `env.example` to `.env`, put your Deriv OAuth client ID in it, and register the local callback `http://127.0.0.1:8080/auth/callback` in the Deriv app. Then run `npm start` and open `http://127.0.0.1:8080`.

More detail: [LOGIN-SETUP.md](LOGIN-SETUP.md).
