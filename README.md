# Predicators

A multiplayer prediction-games site: **Aviator**, **Color Prediction**, **Number Wheel** and **Ludo**, plus an owner console.

## How it works

- **Credits** are allocated only by the owner from `/admin` → *Credits*. There is no payment gateway and no free coins.
- **Shared rounds** — everyone sees the same round at the same time (server-authoritative, Socket.IO):
  - Aviator: 60 s betting window, then the flight, then a 5 s pause, repeating.
  - Color Prediction: 30 s rounds (betting locks for the last 5 s).
  - Number Wheel: 20 s betting, 6 s spin, 4 s result.
- **Ludo**: open a table for **2 or 4 players** at a chosen stake; the winner takes the pot minus the house fee (default 10%, set in *Games*).
- **Stakes**: 10, 20, 50, or any multiple of 100 — enforced on client and server.
- Outcomes come from a CSPRNG on the server and are never sent before they are decided.
- Every balance change is an append-only ledger row; stakes of unfinished rounds are refunded if the server restarts.

## Run it

Requires **Node ≥ 22.5** (uses built-in `node:sqlite`) and a **long-running process** (not serverless/Vercel).

```bash
cp .env.example .env     # set ADMIN_EMAIL / ADMIN_PASSWORD
npm install
npm run dev              # http://localhost:3000
# production
npm run build && npm start
```

On first start the owner account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dev default `admin@predicators.com` / `admin123`; production requires a password of 10+ characters). Set `INSECURE_COOKIES=1` only when testing production mode over plain HTTP.

Data lives in SQLite at `DATABASE_PATH` (default `./data/predicators.db`). Game engines keep live round state in memory, so run a **single instance**.

## Structure

```
server.ts                 custom server: Next + Socket.IO
src/server/               db, auth, wallet/ledger, socket, game engines (games/*)
src/app/api/              auth, wallet, leaderboard, admin APIs
src/app/(site)/           player site      src/app/admin/   owner console
src/lib/games/            rules shared by client and server
```

## Responsible-use note

Credits are only allocated by the owner and have no built-in cash purchase or cash-out. Before attaching real money to games like these, check the gambling/real-money gaming law that applies to you.
