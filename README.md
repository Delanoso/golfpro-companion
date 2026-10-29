# GolfPro Companion

GolfPro Companion is a mobile-first golf app for:

- scorecard tracking (9/18, per-hole)
- club distance data + caddy recommendations
- betting game calculations + settlement
- shared leagues with invite links
- cross-device cloud sync (Supabase)

## Main Features

1. **Analytics**
   - score and putting summaries
   - GIR and FIR tracking
   - last-5 vs previous-5 trend cards
   - strokes gained lite indicators

2. **Rounds**
   - quick per-hole mode (next/prev)
   - table scorecard mode
   - wedge shot outcomes (+ second wedge shot option)
   - per-hole draft auto-save

3. **Clubs + Caddy**
   - build-your-bag selection
   - log shot distances by selected club only
   - caddy recommendation from personal averages

4. **Betting**
   - Skins, Nassau, Snake, Match Play
   - 2v2 Best Ball, Wolf, Stableford
   - per-game settlement + share output

5. **Leagues**
   - create/join by invite link or code
   - link saved rounds into league
   - admin controls (lock/archive/promote/remove)
   - challenge-mode monthly leaderboard

6. **Account**
   - Supabase auth (register/login/reset password)
   - change display name/email/password
   - public profile share link toggle

## Data + Sync

- Local draft state is stored in browser storage for fast recovery.
- Main app data is synced to `public.player_app_data` in Supabase.
- Shared league data is stored in `leagues`, `league_members`, and `league_rounds`.

## Required Environment Variables

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Alternative variable names also supported:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

Optional monitoring:

```bash
VITE_SENTRY_DSN=...
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Supabase Setup

Run `supabase/schema.sql` in the Supabase SQL Editor.

If you have direct DB access, you can also run:

```bash
./scripts/supabase-run-schema.sh "postgres://..."
```

Create compressed backup:

```bash
./scripts/supabase-backup.sh "postgres://..."
```

## Local Run

```bash
npm install
npm run dev -- --host
```

## Build

```bash
npm run build
```

## VPS Deploy

```bash
docker compose -f docker-compose.vps.yml up -d --build
```
