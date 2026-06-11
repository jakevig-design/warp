# WARP — status report

## What WARP is

Single-user React+Vite app for browsing a personal YouTube music library, backed by Supabase, deployed (eventually) to www.jvtestspace.com.

Full product spec: `/Users/jake/Desktop/Claude Code/WARP_spec.md`

## Project locations

- **Main app:** `/Users/jake/Claude Code Projects/warp/`
- **LM sync sidecar:** `/Users/jake/Claude Code Projects/warp/tools/yt-music-sync/`

## What's done

**Frontend (WARP itself)**
- Full scaffold built from spec: 19 components, 5 hooks, 3 utils, full design tokens in `src/App.css`
- `npm install` + `npm run build` pass cleanly (100 modules, no errors)
- Dev server runs at `http://localhost:5173`
- Google OAuth sign-in works end-to-end
- Library load works (returns empty until import happens)

**Supabase**
- Project: `https://xdmhyjofbbtmjqprjsxj.supabase.co`
- Schema run successfully (`tracks`, `track_overrides`, `playlists`, `playlist_tracks`)
- RLS enabled with "authenticated" policy
- `.env.local` in warp/ has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key)

**Sidecar tool (the LM importer)**
- Built at `tools/yt-music-sync/`
- Files: `sync.py`, `setup_from_curl.py`, `run.sh`, `requirements.txt`, `.env`, `.env.example`, `.gitignore`
- venv exists with deps installed (`ytmusicapi 1.10.3`, `supabase 2.31.0`, `python-dotenv`)
- `.env` has `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` filled in (service_role bypasses RLS — admin-only, gitignored)

## Why the sidecar exists

YouTube Music's "Liked Music" (LM) playlist is **not** accessible via YouTube Data API v3 — it's a YT Music construct, not a YouTube playlist. Even user-OAuth doesn't expose it. The only practical path is `ytmusicapi`, an unofficial Python library that uses browser-extracted auth headers to call YT Music's internal API.

The sidecar is a build/import tool — runs on Jake's machine, writes rows into Supabase, and stays out of the live WARP app (no backend in production).

Jake's whole use case is LM, so this is the primary import path. WARP's built-in YT-Data-API importer still exists for any `PL...` playlists, but LM is the main one.

## What's blocked

The sidecar needs `browser.json` (YT Music auth file). The plan was:
1. In Chrome at `music.youtube.com`, DevTools → Network → right-click any `youtubei` request → **Copy → Copy as cURL (bash)**
2. `pbpaste > curl.txt && ./run.sh` — `setup_from_curl.py` parses the cURL, extracts headers, writes `browser.json`, smoke-tests it
3. `sync.py` then runs and writes LM into Supabase

**Latest attempt failed with:** `error: no -H headers found in input — was that a cURL command?`

Likely cause: wrong DevTools "Copy" option (e.g., `Copy URL` or `Copy as fetch` instead of `Copy as cURL (bash)`), or Jake is on Safari/Firefox where the menu wording differs.

## Next concrete step

Verify what's in `curl.txt` right now:

```bash
head -c 100 /Users/jake/Claude\ Code\ Projects/warp/tools/yt-music-sync/curl.txt
```

- Starts with `curl '...` → real cURL, debug `setup_from_curl.py` parser
- Starts with `https://...` → user copied URL, redo the copy
- Starts with `fetch(...` → user copied as fetch, redo the copy
- Starts with `:authority:` or HTTP-headerish text → user copied from Headers panel directly, redo the copy

Re-copy procedure (Chrome specifically):
1. Open `music.youtube.com`, signed in
2. F12 → Network tab → click "Fetch/XHR" filter button at top
3. Refresh page
4. Find any request whose URL contains `/youtubei/`
5. **Right-click that row in the list** (not in the Headers panel) → Copy → **Copy as cURL (bash)**
6. Verify clipboard: `pbpaste | head -c 50` should start with `curl '`
7. Then: `cd /Users/jake/Claude\ Code\ Projects/warp/tools/yt-music-sync && pbpaste > curl.txt && ./run.sh`

If Jake is on Safari: the option is "Copy → cURL". On Firefox: "Copy Value → Copy as cURL (POSIX)". The parser handles all three since they all use `-H 'Key: Value'` form.

## After the sync succeeds

`./run.sh` will print `[warp-sync] done. +N new · N total in LM`. Then:
- Refresh WARP at `http://localhost:5173`
- LIBRARY tab fills with all LM tracks
- PLAYLISTS tab shows "Liked Music"
- Star toggle, artist/genre inline edits, search, play via YT iframe — all should work

Remaining functional checklist from `WARP_spec.md` step 4 is unchecked. Deployment to Vercel + www.jvtestspace.com (spec step 5) hasn't been started.

## Sensitive values reference

Don't commit any of these. All gitignored.
- `warp/.env.local` — VITE_SUPABASE_URL (public-ish), VITE_SUPABASE_ANON_KEY (publishable, safe for frontend)
- `warp/tools/yt-music-sync/.env` — SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (admin key, sensitive)
- `warp/tools/yt-music-sync/browser.json` — when it exists, contains YT Music session cookies (sensitive)
- `warp/tools/yt-music-sync/curl.txt` — intermediate file during auth setup; deleted by run.sh after parsing

## Background processes likely running

- Vite dev server (port 5173). Verify: `lsof -ti :5173`
- Kill+restart cleanly: `lsof -ti :5173 | xargs kill -9; cd /Users/jake/Claude\ Code\ Projects/warp && npm run dev &`
