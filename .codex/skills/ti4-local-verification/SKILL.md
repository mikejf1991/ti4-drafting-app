---
name: ti4-local-verification
description: >
  Use this skill when installing, building, running, or locally verifying the TI4 Drafting App, especially after code or dependency changes. It covers the correct Windows checkout, repeatable tests, production server command, HTTP and browser checks, and the known npm and Turbopack failures.
---

# Verify the TI4 app locally

This is the proven local path for the TI4 Drafting App. Run commands in `C:\Users\polymergroup\Desktop\TI4 Drafting App`; inspect the current repo first if it has moved.

**Failure pattern:** A similarly named Documents checkout, npm peer-resolution errors, or Next tracing local room data can give misleading failures or test the wrong code.
**Verified by:** `npm test` passed 21 tests, `npm run build` completed cleanly, and the production server passed `node scripts/verify-api.mjs http://127.0.0.1:3184` with eight scenarios and 61 board tiles, including against the provisioned Supabase table. Browser checks independently opened seat links and confirmed private views; three downloaded exports were verified by exact filenames.

## Procedure

1. Set the shell working directory explicitly to `C:\Users\polymergroup\Desktop\TI4 Drafting App`. Confirm `git status --short` and inspect `package.json`, `.npmrc`, `next.config.ts`, and `lib/store.ts` before changing dependencies or configuration. Do not use `C:\Users\polymergroup\Documents\ChatGPT\TI4 Drafting App` for this project.
2. Install with `npm ci`. The committed `.npmrc` supplies `legacy-peer-deps=true`; `package.json` pins Vitest `4.1.11`. Keep that combination when reinstalling. Run `npm test`, `npm run typecheck`, and `npm run build`, fixing any concrete failures before proceeding.
3. For a local production smoke test, set `TI4_STORAGE=local` and `TI4_LOCAL_DIR` to a writable, ignored, test-only directory. Remove `VERCEL` from that process environment: local mode in `lib/store.ts` is disabled whenever `VERCEL` is set. Do not copy API keys into the test command or output.
4. Start the built app from this directory with `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3184`. Keep the process handle for polling and shutdown. Then run `node scripts/verify-api.mjs http://127.0.0.1:3184`. The script creates marked practice rooms and checks the real HTTP API; run it only against the intended local or staging instance.
5. Check the UI separately in a browser: create/open a practice room, independently open seat links, and verify that one seat cannot see another seat's ranking or hand. Use computer/browser UI tools for interactions and the HTTP script for API assertions. For export downloads, click the control and check the exact expected filename in Downloads after the click; a download-event wait alone is not proof of failure. When the browser API provides screenshot bytes, save with `await fs.writeFile(path, await tab.screenshot())` and inspect the image.

## Verify the real Supabase backend

1. Confirm that the isolated `public.ti4_draft_rooms_v1` table from `database/001_rooms.sql` has been provisioned. The migration grants access only to `service_role`; it does not alter SWPA tables. Keep `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in ignored `.env.local` and do not print their values.
2. Start the built production server with `TI4_STORAGE=supabase` in its process environment, using the Next binary command in step 4. Run `node scripts/verify-api.mjs http://127.0.0.1:3184`; expect eight passed scenarios and 61 final board tiles. The script creates two marked practice rooms in the TI4 table.
3. Probe `GET /rest/v1/ti4_draft_rooms_v1?select=id&limit=1` with Node `fetch`, printing only HTTP status and error code. Use the SWPA publishable key from the first line of the ignored `C:\Users\polymergroup\Desktop\2026-04 SWPA Mobile App Dev\Supabase\Supabase_Keys.txt` as `apikey`: it was denied with HTTP 401 and PostgreSQL code `42501`. Repeat with `SUPABASE_SECRET_KEY` from TI4 `.env.local`: it returned HTTP 200. Do not print response rows, request headers, or key values.

## Gotchas

- The verified production app is `https://ti4-drafting-app.vercel.app`, imported from `mikejf1991/ti4-drafting-app` into Vercel team `mikejf1991s-projects` on Hobby. Set the three server-only variables as sensitive values: `TI4_STORAGE=supabase`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY`. Updates to main deploy through the existing GitHub installation. The hosted API verification passed all eight scenarios; independent browser seats confirmed private previews, cancel/reposition, synchronization after confirmation, reload persistence, and desktop wheel stability. Preserve real player rooms when repeating checks; the verifier creates marked practice rooms.

- `next.config.ts` sets `turbopack.root: process.cwd()` to avoid an unrelated parent lockfile. `lib/store.ts` uses `path.resolve(/* turbopackIgnore: true */ ...)` so runtime room data is never traced into deployment bundles.
- Keep production secrets out of the client. `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are server environment names; do not put their values in this skill, logs, or frontend variables. Choose `TI4_STORAGE=local` for filesystem tests and `TI4_STORAGE=supabase` only for the real backend check.
- A passing build or local storage test does **not** prove Supabase provisioning or deployment. Verify those separately against authoritative remote state; the Supabase check above does not prove a Vercel deployment.

## What didn't work

- Plain `npm install` before `.npmrc` was configured failed with npm's `null edgesOut` peer-resolution error. An earlier Vitest `4.0.18` installation ran tests but was superseded by the `4.1.11` plus `legacy-peer-deps` combination, which installed and audited with zero reported vulnerabilities.
- In PowerShell, `npm run start -- --port 3184` lost the flag and treated `3184` as a directory. Invoke the Next binary through `node` with explicit `--hostname` and `--port` instead.
- A browser `waitForEvent('download')` timed out after the PNG had actually saved. Check the exact downloaded file after clicking; all three export files were confirmed this way.
- PowerShell `Invoke-WebRequest` returned a misleading 401 for the server key during the direct REST probe. Node `fetch`, matching the app's request shape, returned 200 for that key while the public key remained denied.
