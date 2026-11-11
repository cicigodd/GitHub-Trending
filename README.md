# Pulse — GitHub Trending Monitor

A Next.js dashboard for discovering GitHub Trending repositories and building a daily history of their stars and forks.

## Features

- Live GitHub Trending: daily, weekly, and monthly
- Search, language filters, rising-star sorting, browser-local watchlist
- PostgreSQL storage for repository metadata and daily star/fork snapshots
- Protected collection endpoint and repository history API
- Vercel Cron scheduled collection (daily)

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS, Lucide icons, Cheerio
- Neon serverless PostgreSQL
- Vercel deployment and Cron

## Run locally

```bash
npm install
npm run dev
```

## API

- `GET /api/health` — service health
- `GET /api/trending?since=daily|weekly|monthly` — live Trending data
- `GET /api/history?repo=owner/name&days=30` — stored star/fork history
- `GET /api/cron/collect` — protected daily collector (requires `Authorization: Bearer <CRON_SECRET>`)

## Database setup

1. Create a PostgreSQL database with Neon.
2. Run `db/schema.sql` once in the Neon SQL Editor.
3. Set `DATABASE_URL` and `CRON_SECRET` in Vercel project environment variables.
4. Deploy the project. Vercel Cron calls the collector daily at 08:00 UTC.

The first historical chart baseline starts after the first successful collection. Daily snapshots cannot reconstruct history from before collection began.

## Scheduling limits

The included Vercel Cron schedule is daily. More frequent collection requires a hosting plan and scheduler that support the desired cadence, or an external scheduler calling the protected endpoint.

Never commit database URLs or cron secrets.
