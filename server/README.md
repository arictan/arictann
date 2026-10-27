# Sushi Stack server

A small reference backend for the online parts of the game. It's plain Node (18 or newer) with
no dependencies, and it keeps its data in one JSON file. Until it's deployed and its address is
set, the game runs offline and shows simulated players, always labelled "(AI)" or "simulated".

| Feature | Endpoint | What the game does with it |
|---|---|---|
| Daily Roll board | `POST /daily`, `GET /daily?day=&player=` | "You beat 72% of 3,410 players · #418", top 20 |
| Friends | `POST /friends` | Friends' Daily Roll scores (friends = invite codes you entered) |
| Tower of the World | `POST /world`, `GET /world?day=` | The real shared total instead of the simulated one |
| Country cup | `POST /country`, `GET /country?week=` | Real per-country averages instead of AI countries |
| Cloud backup | `POST /backup`, `POST /restore` | Save code stored under an 8-letter ID + 4-digit PIN |
| Delete my data | `POST /forget` | Settings → Delete my online data |
| Health check | `GET /health` | For your host's uptime check |

## Run it

```
node server/server.mjs                    # port 8787, data in server/data.json
PORT=8080 DATA=/var/data/sushi.json ALLOW_ORIGIN=https://yourgame.example node server/server.mjs
TRUST_PROXY=1 node server/server.mjs           # only behind your own HTTPS proxy (Caddy, nginx, Fly…)
node server/test.mjs                      # 12 tests
```

Then point the game at it, in one of two ways:

* **Remote config (no app update):** add `"serverUrl": "https://your-server.example"` to the
  remote config JSON (see `src/config.ts`).
* **Built in:** set the `serverUrl` default in `src/config.ts`.

The app must reach it over **HTTPS**. Phones block plain HTTP by default. Allow the host in
`capacitor.config.ts` (`server.allowNavigation`) only if you load remote pages; API calls with
`fetch` just need CORS, which the server sends (`ALLOW_ORIGIN`, default `*`).

## Hosting

Anything that runs Node works. It needs one small always-on instance, and it must keep the data
file between restarts (a persistent volume/disk):

* **Fly.io / Railway / Render:** a Node service with a 1 GB volume mounted at, say, `/data`, and
  `DATA=/data/sushi.json`.
* **A small VPS:** `node server/server.mjs` under systemd, behind Caddy or nginx for HTTPS.

A minimal Dockerfile:

```
FROM node:22-alpine
WORKDIR /app
COPY server/server.mjs .
ENV DATA=/data/sushi.json PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
```

Copy the data file somewhere else daily (cloud backups live in it).

## What it checks (light anti-cheat)

* Scores have upper limits (a Daily Roll ≤ 400, a country-cup run ≤ 1,500, world layers ≤ 600 per
  post and 6,000 per player per day). See `LIMITS` in `server.mjs`.
* Days must be today or yesterday in some time zone; a player counts for one country a week.
* 60 requests per minute per IP. Behind a proxy, set `TRUST_PROXY=1` so the real IP is used; without a proxy leave it off, or anyone could fake their IP. Wrong PINs: 5 per backup per hour, then it locks for an hour.
* Names are cut to 16 characters with control characters and `<>` removed. There's **no word
  filter**: add one before showing names publicly in a big launch, or show only "Chef #1234".

This stops casual tampering. It won't stop someone who rewrites the app. For prize-bearing
leaderboards, add device attestation (Play Integrity on Android, App Attest on iOS) and verify
runs on the server (the Daily Roll is seeded, so a run's drop log can be replayed).

## Before a big launch

* Move from the JSON file to a database (SQLite is plenty for tens of thousands of players;
  Postgres beyond). The routes are small, so the change stays local to `server.mjs`.
* Put it behind HTTPS with a real domain, and add the domain to the privacy policy.
* Update **PRIVACY.md** and the store privacy forms (Google Play Data safety, App Store privacy
  labels). With the server on, the game sends: a random player ID (not linked to the person's
  identity), the chef name they typed, scores, country choice, and, if they back up, their
  save. Nothing else: no contacts, location, advertising ID or email.
* Point "Delete my online data" in your privacy policy at the in-game button (Settings → Save).

## Data kept

| Data | Kept for |
|---|---|
| Daily and world-tower entries | 14 days |
| Country-cup weeks | the last 4 weeks |
| Cloud backups | 1 year after last use |
