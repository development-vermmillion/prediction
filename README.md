# Predicators

A prediction-games arcade built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4**.
Four playable games — **Aviator, Ludo, Color Prediction, Number Wheel** — a full player-facing site, and an
**owner dashboard** at `/admin`.

> All games use **virtual coins with no cash value**. Game engines run in the browser as simulations for demo
> purposes. For anything real, outcomes (crash points, wheel results, dice) **must be generated and settled
> server-side**, and balances must live in a database.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
```

| Script              | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Production build                |
| `npm start`         | Serve the production build      |
| `npm run typecheck` | Type-check with `tsc --noEmit`  |
| `npm run format`    | Format with Prettier            |

### Owner dashboard

Open **`/admin`** and sign in with the demo credentials (override via `.env.local`):

```
email:    admin@predicators.com
password: admin123
```

The dashboard has Overview (KPIs + charts), Players (search, filter, suspend/ban), Games (enable, RTP, stake
limits), Rounds, Transactions, Promotions and Settings. Auth is a **client-side demo guard** — replace it with a
real session (e.g. NextAuth or JWT cookies + `middleware.ts`) before deploying.

## Project structure

```
src/
├─ app/
│  ├─ (site)/            Player site (navbar, footer, mobile nav layout)
│  │  ├─ page.tsx        Home
│  │  ├─ games/          Games list + aviator, color-prediction, number-wheel, ludo
│  │  ├─ leaderboard/  wallet/  rewards/  profile/
│  ├─ (auth)/            login, register (no site chrome)
│  ├─ admin/
│  │  ├─ login/          Owner sign-in
│  │  └─ (dashboard)/    Guarded layout: overview, users, games, rounds,
│  │                     transactions, promotions, settings
│  ├─ layout.tsx         Root layout, ambient background, toaster
│  └─ globals.css        Tailwind v4 theme, liquid-glass utilities, animations
├─ components/
│  ├─ ui/                Design-system primitives (GlassCard, Button, Chip, StakeInput…)
│  ├─ layout/            Site navbar, mobile nav, footer, wallet pill
│  ├─ home/              Hero pieces, game cards, live-wins ticker, podium, daily streak
│  ├─ games/             One folder per game + shared GameShell
│  ├─ admin/             Admin shell, data table, stat cards, charts
│  └─ auth/              Player auth form
├─ lib/
│  ├─ games/             Pure game engines (aviator, color-prediction, number-wheel, ludo)
│  ├─ mock/              Seeded mock data (deterministic, SSR-safe)
│  ├─ constants.ts  utils.ts
├─ services/             Data-access layer — swap mock data for real API calls here
├─ store/                Zustand stores: wallet (persisted), player, admin-auth, toast
├─ hooks/                useMounted, useNow
└─ types/                Shared domain types
```

## Design notes

- **Liquid glass**: `glass` / `glass-strong` utilities (backdrop blur, gradient border, inset highlight) in `globals.css`.
- **Deterministic**: mock data uses a seeded PRNG and Color Prediction rounds are derived from the clock, so every
  client sees the same result and SSR matches hydration. Persisted state is read only after mount (`useMounted`).
- **Engines are pure**: `lib/games/*` contain no React, so they can move to a server unchanged.

## Going to production

1. Move engines to the server (provably-fair RNG) and settle bets there.
2. Replace `src/services` bodies with API calls and `store/wallet.ts` with server balances.
3. Replace the demo admin guard with real authentication and server-side authorization.
4. Check the legal position for your jurisdiction before adding any real-money mechanics.
