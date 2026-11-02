# Importing CASPER V5.0.1 without the GitHub Desktop 0-changes mistake

1. Open GitHub Desktop and choose the repository `casper-live-data-analysis`.
2. Use **Repository → Show in Explorer**. The address must end exactly with `Documents\\GitHub\\casper-live-data-analysis`.
3. Extract this ZIP into a temporary folder first.
4. Open the extracted `casper-live-data-analysis` folder and copy **the contents** into the GitHub Desktop repository root. Do not copy the outer folder into the repository.
5. Replace matching files when Windows asks. This bundle is complete; do not mix files from V4, V0.5, V0.5.1 or older ZIPs.
6. In GitHub Desktop, wait for the Changes tab to refresh. The versioned source files have real content changes, so the repository should show changes rather than relying on file timestamps.
7. Before committing, verify `VERSION.txt` says `0.5.1` and `README.md` says `CASPER Live Data Analysis — v0.5.1`.
8. Commit all intended changes together, then push to `main`.

## Important

- Do not edit `README.md` merely as a test. The version marker and complete bundle are the test.
- Do not move `auth-core.js` into another folder. It contains the V4-compatible Deriv OAuth/session implementation that must remain the login source of truth.
- The application only creates transaction rows after Deriv confirms a purchase.
