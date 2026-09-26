# CASPER Live Data Analysis

Reference-based dashboard with Deriv OAuth login, implemented as a Cloudflare Pages Advanced Mode Worker.

## What is included

- The screenshot-based dashboard in `index.html`.
- Cloudflare Worker routes for Deriv login, callback, session, account selection, and sign-out.
- OAuth Authorization Code + PKCE, state validation, origin checks, and encrypted HttpOnly session cookies.
- A build script that packages the dashboard and Worker entry file for deployment.
- The original Node server for local development.

GitHub Pages can still show the static preview, but it cannot run the authentication functions. Use the Cloudflare Pages `pages.dev` address for Deriv login.

## Deploy to Cloudflare Pages

1. Make sure the files in this folder are in the root of the GitHub repository, including `worker.js`, `build-pages.mjs`, `package.json`, and `index.html`.
2. In Cloudflare, create a **Pages** project and connect the GitHub repository.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`. Leave the root directory as `/`. The build places the Worker entry file at `dist/_worker.js`; Cloudflare uses it to serve the page and handle `/auth/*` requests.
4. Deploy once. Copy the production `pages.dev` address Cloudflare gives you.
5. Register a Deriv OAuth app with this exact callback: `https://YOUR-PAGES-ADDRESS/auth/callback`.
6. In Cloudflare Pages **Settings → Variables and Secrets**, add `DERIV_CLIENT_ID` as a production variable. Add `SESSION_ENCRYPTION_KEY` as a production secret, using a unique random value of at least 32 characters. Do not put that key in GitHub or send it in chat.
7. Redeploy, open the Cloudflare Pages address, and choose **Login with Deriv**.

The app requests only the `trade` scope and prefers the demo account when Deriv returns one. The access token is encrypted with AES-GCM inside a Secure, HttpOnly cookie; frontend JavaScript cannot read it. Anyone with Cloudflare project access can change the application, so keep that access limited to trusted users.

## Local development

Use Node.js 20.6 or newer. Copy `env.example` to `.env`, put your Deriv OAuth client ID in it, and register the local callback `http://127.0.0.1:8080/auth/callback` in the Deriv app. Then run `npm start` and open `http://127.0.0.1:8080`.

More detail: [LOGIN-SETUP.md](LOGIN-SETUP.md).
