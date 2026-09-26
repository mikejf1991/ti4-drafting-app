---
name: ti4-local-verification
description: >
  Use this skill when installing, building, running, or locally verifying the TI4 Drafting App, especially after code or dependency changes. It covers the correct Windows checkout, repeatable tests, production server command, HTTP and browser checks, and the known npm and Turbopack failures.
---

# Verify the TI4 app locally

This is the proven local path for the TI4 Drafting App. Run commands in `C:\Users\polymergroup\Desktop\TI4 Drafting App`; inspect the current repo first if it has moved.

**Failure pattern:** A similarly named Documents checkout, npm peer-resolution errors, or Next tracing local room data can give misleading failures or test the wrong code.
**Verified by:** `npm test` passed 21 tests, `npm run build` completed cleanly, and the production server passed `node scripts/verify-api.mjs http://127.0.0.1:3184` with eight scenarios and 61 board tiles. Browser checks independently opened seat links and confirmed private views; three downloaded exports were verified by exact filenames.

## Procedure

1. Set the shell working directory explicitly to `C:\Users\polymergroup\Desktop\TI4 Drafting App`. Confirm `git status --short` and inspect `package.json`, `.npmrc`, `next.config.ts`, and `lib/store.ts` before changing dependencies or configuration. Do not use `C:\Users\polymergroup\Documents\ChatGPT\TI4 Drafting App` for this project.
2. Install with `npm ci`. The committed `.npmrc` supplies `legacy-peer-deps=true`; `package.json` pins Vitest `4.1.11`. Keep that combination when reinstalling. Run `npm test`, `npm run typecheck`, and `npm run build`, fixing any concrete failures before proceeding.
3. For a local production smoke test, set `TI4_STORAGE=local` and `TI4_LOCAL_DIR` to a writable, ignored, test-only directory. Remove `VERCEL` from that process environment: local mode in `lib/store.ts` is disabled whenever `VERCEL` is set. Do not copy API keys into the test command or output.
4. Start the built app from this directory with `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3184`. Keep the process handle for polling and shutdown. Then run `node scripts/verify-api.mjs http://127.0.0.1:3184`. The script creates marked practice rooms and checks the real HTTP API; run it only against the intended local or staging instance.
5. Check the UI separately in a browser: create/open a practice room, independently open seat links, and verify that one seat cannot see another seat's ranking or hand. Use computer/browser UI tools for interactions and the HTTP script for API assertions. For export downloads, click the control and check the exact expected filename in Downloads after the click; a download-event wait alone is not proof of failure. When the browser API provides screenshot bytes, save with `await fs.writeFile(path, await tab.screenshot())` and inspect the image.

## Gotchas

- `next.config.ts` sets `turbopack.root: process.cwd()` to avoid an unrelated parent lockfile. `lib/store.ts` uses `path.resolve(/* turbopackIgnore: true */ ...)` so runtime room data is never traced into deployment bundles.
- Keep production secrets out of the client. `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are server environment names; do not put their values in this skill, logs, or frontend variables. Local verification uses `TI4_STORAGE=local` instead.
- A passing local build and smoke test does **not** prove the Supabase schema is provisioned or the app is deployed. Verify those separately against authoritative remote state.

## What didn't work

- Plain `npm install` before `.npmrc` was configured failed with npm's `null edgesOut` peer-resolution error. An earlier Vitest `4.0.18` installation ran tests but was superseded by the `4.1.11` plus `legacy-peer-deps` combination, which installed and audited with zero reported vulnerabilities.
- In PowerShell, `npm run start -- --port 3184` lost the flag and treated `3184` as a directory. Invoke the Next binary through `node` with explicit `--hostname` and `--port` instead.
- A browser `waitForEvent('download')` timed out after the PNG had actually saved. Check the exact downloaded file after clicking; all three export files were confirmed this way.
