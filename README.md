# GolfPro Companion (Analytics Rebuild)

This app was rebuilt as a **mobile-first golf performance suite** focused on:

- personal stats & advanced analytics
- social betting game tracking
- smart caddy club recommendations from your own data
- custom local league scoring + auto handicap
- club distance tracking (min/max/average)

## Feature Modules

1. **Analytics Dashboard**
   - round trends and score vs par
   - putting efficiency (1-putt and 3-putt rates)
   - wedge distance buckets (average leave distance)
   - biggest stroke leak insights
   - betting + league snapshot

2. **Round Entry**
   - score, putts, one-putt/three-putt counts
   - wedge shot logging for analytics (distance + proximity)
   - recent rounds list with delete

3. **Club Distance Tracking**
   - log shots by club
   - track min, max, average, sample count
   - recent shot log
   - distance unit toggle support (meters default, optional yards)

4. **Smart "Caddy" Strategy**
   - target distance + conditions adjustments
   - recommends best and backup clubs using your own history
   - shows typical miss tendency by recommended club

5. **Betting & Social Games**
   - supports Vegas, Banker, Hammer entry
   - per-player points and net settlement tracking
   - running net leaderboard

6. **Local League Manager**
   - add/remove players
   - custom winner/participation points
   - add league rounds with gross score entry
   - auto handicap estimate + net score + points
   - shared leaderboard

## Data Persistence

All entries are saved to browser `localStorage`, so analytics update immediately as data is entered.

## Distance Units

- App defaults to **meters**.
- You can switch to **yards** from the header unit selector.
- Stored data remains consistent while views and input labels adapt to your selected unit.

## Run

```bash
npm install
npm run dev -- --host
```

## Build

```bash
npm run build
```
