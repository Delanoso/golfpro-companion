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

## Deploy on a VPS (alongside another app)

This app is static and can run in Docker on a different port so it does not conflict with your other VPS app.

### 1) Upload repo and SSH into VPS

```bash
cd /path/to/your/projects
git clone <your-repo-url> golfpro-companion
cd golfpro-companion
```

### 2) Build and run in isolated mode (default)

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

Test:

```bash
curl -I http://127.0.0.1:8087
```

By default the container binds to `127.0.0.1:8087`, which means:
- it does **not** touch ports `80/443`
- it does **not** conflict with your existing domain app

### 2b) If you explicitly want IP:port public access

Create an override env file on the VPS (you can copy `deploy/vps.env.example`):

```bash
cat > .env.vps << 'EOF'
GOLFPRO_BIND_IP=0.0.0.0
GOLFPRO_HOST_PORT=8087
EOF
```

Then run:

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

And allow firewall:

```bash
sudo ufw allow 8087/tcp
```

### 3) (Optional) Put behind your existing Nginx reverse proxy

Use `deploy/nginx-site-example.conf` as a template and point your subdomain to:

- `http://127.0.0.1:8087`

Then reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4) Updating later

```bash
git pull
docker compose -f docker-compose.vps.yml up -d --build
```
