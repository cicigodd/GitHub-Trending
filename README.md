# Pulse — GitHub Trending Monitor

A web application for discovering trending GitHub repositories and tracking star growth over time.

## Current status

The first web dashboard scaffold is available on `feat/web-dashboard`. The repository list is explicitly marked as sample data; live collection and persistence are not connected yet.

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS and Lucide icons
- Planned: PostgreSQL, scheduled ingestion worker, GitHub REST API

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Health endpoint

`GET /api/health` returns service status.

## Roadmap

1. Responsive dashboard and repository exploration UI
2. GitHub Trending ingestion with parser fixtures and failure handling
3. GitHub API synchronization and rate-limit-aware star snapshots
4. PostgreSQL persistence and scheduled worker
5. Watchlists, alerts, authentication, and deployment configuration

Never commit GitHub tokens or database credentials. Keep secrets in server-side environment variables.
