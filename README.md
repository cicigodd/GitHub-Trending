# Pulse — GitHub Trending Monitor

A Next.js dashboard for exploring repositories currently trending on GitHub.

## Current features

- Live repository data from GitHub Trending (daily, weekly, monthly)
- Search and programming-language filters
- Rising-stars sorting using the period gain displayed by GitHub
- Browser-local watchlist
- Server-side HTML parsing; no GitHub token required for the public Trending page
- 15-minute response caching and a health endpoint

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS, Lucide icons, Cheerio
- Deployment target: Vercel

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## API

- `GET /api/health` — service health
- `GET /api/trending?since=daily|weekly|monthly` — live GitHub Trending repositories

## Notes

The Trending endpoint parses GitHub's public HTML page. GitHub may change its markup or apply request limits; the API returns a clear error if the expected repository rows cannot be found. This first milestone does not yet store historical snapshots, provide cross-device accounts, or send alerts.

## Roadmap

1. Live Trending dashboard
2. Historical star snapshots and momentum charts
3. Persistent watchlists and user accounts (if needed)
4. Notifications and production monitoring

Never commit GitHub tokens or database credentials. Keep secrets in server-side environment variables.
