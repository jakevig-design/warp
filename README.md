# WARP

A personal music library manager that sits on top of YouTube. Winamp-inspired
UI, iTunes-style organization. Single-user, Supabase-backed, fully browser-direct
— no backend server, no API proxy.

YouTube owns the files. WARP owns the organization.

```
┌─────────────────────────────────────────────┐
│  WARP  v3.0                       ▼ SYNC    │  TitleBar
├─────────────────────────────────────────────┤
│  ┌──────────┐  Comfortably Numb — Pink Flo  │  PlayerPanel
│  │ ▌▌▌▌▌▌▌▌ │  THE WALL                     │   (iframe / LCD
│  │ ▌▌▌▌▌▌▌▌ │  ◆ CLASSIC ROCK               │    info panel)
│  └──────────┘  06:23 / 06:54                │
├─────────────────────────────────────────────┤
│  [⏮][▶][⏭]  ████████░░░░  🔀  🔊──         │  TransportBar
├─────────────────────────────────────────────┤
│  LIBRARY  GENRES  ARTISTS  PLAYLISTS  ★     │  TabBar
├─────────────────────────────────────────────┤
│  🔍 search…                            CLR  │  SearchBar
│  [ALL] [REGGAE] [ROCK] [JAZZ] [CLASSICAL]   │  GenreFilters
├──┬──┬──────────┬──────┬───────┬───────┬─────┤
│☑ │★ │ TITLE ▲  │ART…  │ ALBUM │ GENRE │TIME │
│  │  │ rows…    │      │       │       │     │
└──┴──┴──────────┴──────┴───────┴───────┴─────┘
```

## Features

- Sign in with Google; YouTube access via OAuth (no API key to manage)
- Import YouTube Music Liked Music + arbitrary YouTube playlists
- Plays via YouTube's iframe API — no separate audio download
- Browse by Library, Genres, Artists, Playlists, Starred
- Inline edit artist / album / genre — edits live in a separate `track_overrides`
  table so re-imports never blow them away
- Row checkboxes for bulk edit (set genre, star, unstar)
- Click any column header to sort; click again to reverse
- Search across title / artist / genre
- Last.fm enrichment for genres on `Unknown` tracks
- LCD-style now-playing display with animated visualizer when idle

## Stack

- **React 18 + Vite**
- **Supabase** — Postgres + auth via Google OAuth
- **Vercel** — deployment
- No backend, no Node server, no API proxy. Every external call is direct from
  the browser.

## Setup

### 1. Supabase

Create a project at supabase.com. In the SQL editor, run the [schema](#schema) below.

Then in the dashboard:

- **Authentication → Providers → Google** → enable, paste your Google OAuth
  Client ID + Secret (from step 2)
- **Authentication → URL Configuration → Redirect URLs** → add
  `http://localhost:5173` for local dev and your production URL when you deploy

### 2. Google Cloud Console

- **APIs & Services → Library** → enable **YouTube Data API v3**
- **APIs & Services → Credentials** → Create credentials → OAuth 2.0 Client ID
  (Web application). Authorized redirect URIs must include:
  ```
  https://YOUR_PROJECT.supabase.co/auth/v1/callback
  ```
- **APIs & Services → OAuth consent screen → Scopes** → add
  `https://www.googleapis.com/auth/youtube.readonly`
- **OAuth consent screen → Audience → Test users** → add your Google account
  (required while the app is unverified — up to 100 test users without going
  through Google's full verification process)

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
```

The publishable / anon key is safe to expose — RLS handles access control.

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:5173, sign in with Google, click ▼ SYNC →
**▶ IMPORT LIKED MUSIC**.

## Schema

```sql
create table tracks (
  video_id    text primary key,
  title       text not null,
  artist      text not null,
  album       text,
  genre       text default 'Unknown',
  duration    text,
  starred     boolean default false,
  added_at    timestamptz default now()
);

create table track_overrides (
  video_id    text primary key references tracks(video_id) on delete cascade,
  artist      text,
  album       text,
  genre       text,
  updated_at  timestamptz default now()
);

create table playlists (
  playlist_id  text primary key,
  name         text not null,
  imported_at  timestamptz default now()
);

create table playlist_tracks (
  playlist_id  text references playlists(playlist_id) on delete cascade,
  video_id     text references tracks(video_id) on delete cascade,
  position     integer,
  primary key (playlist_id, video_id)
);

alter table tracks          enable row level security;
alter table track_overrides enable row level security;
alter table playlists       enable row level security;
alter table playlist_tracks enable row level security;

create policy "owner only" on tracks          for all using (auth.role() = 'authenticated');
create policy "owner only" on track_overrides for all using (auth.role() = 'authenticated');
create policy "owner only" on playlists       for all using (auth.role() = 'authenticated');
create policy "owner only" on playlist_tracks for all using (auth.role() = 'authenticated');
```

## Architecture notes

**Single user.** The RLS policy is `auth.role() = 'authenticated'` — any
signed-in user can read/write everything. This is fine for a personal project
on your own Supabase project. Don't reuse the Supabase project for anything
multi-tenant without rewriting the policies.

**Edits never mutate `tracks`.** Inline edits (artist, album, genre) go into
`track_overrides` keyed by `video_id`. `mergeTrack(track, override)` merges them
at display time. Re-imports use `upsert(..., { ignoreDuplicates: true })` on
`tracks`, so your edits survive every sync forever.

**Star is on the track, not an override.** Starring is a collection action, not
metadata about the track. It lives on `tracks.starred`.

**YouTube access via session token.** WARP reads
`session.provider_token` (the Google OAuth access token Supabase stores after
sign-in) and passes it as `Authorization: Bearer …` to the YouTube Data API.
There's no separate YouTube API key anywhere.

**Liked Music caveat.** YouTube Music's "Liked Music" (playlist ID `LM`) is a
YT Music construct that the YouTube Data API doesn't reliably expose. WARP tries
`LM` first, falls back to `LL` (YouTube's "Liked Videos") if `LM` returns
nothing. Accounts with YT Music ↔ YouTube like-sync turned on will get their
music likes through `LL`.

**API keys.** Last.fm key lives in `sessionStorage` only — cleared on tab close,
never written to env vars or Supabase.

## Project structure

```
warp/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx                  reducer + auth + layout
│   ├── App.css                  design tokens + every component style
│   ├── supabase.js              supabase client init
│   ├── components/              19 components
│   ├── hooks/
│   │   ├── useLibrary.js        load tracks + overrides + playlists
│   │   ├── useOverrides.js      save artist/album/genre overrides + bulk ops
│   │   ├── useYouTube.js        OAuth fetch + import (LM/LL fallback)
│   │   └── useLastFm.js         genre enrichment (artist.gettoptags)
│   └── utils/
│       ├── mergeTrack.js        merge track + override into display object
│       ├── parseDuration.js     ISO 8601 PT4M13S → 4:13
│       ├── genreCategories.js   canonical genre dropdown list
│       ├── genreMap.js          Last.fm tag normalization + stoplist
│       └── refreshToken.js      get current OAuth token from Supabase session
├── index.html                   YT iframe API bootstrap
├── vite.config.js
└── package.json
```

## Scripts

```bash
npm run dev      # vite dev server on :5173 with HMR
npm run build    # production build → dist/
npm run preview  # serve the dist/ build locally on :4173
```

## What WARP does not do

- No audio download or offline playback
- No write-back to YouTube (can't create/edit YouTube playlists)
- No multi-user support
- No mobile app — responsive web only
- No lyrics
- No equalizer or audio FX

## Design rules

- `Share Tech Mono` font everywhere
- Backgrounds: `#111` → `#232323` range
- Only colors: `#00cc66` (accent) and `#00ff88` (active / bright)
- No gradients, no box shadows, no border radius > 3px
- All labels: 10px, uppercase, letter-spacing 1.5px
