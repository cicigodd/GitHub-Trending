-- Pulse database schema (PostgreSQL / Neon)
-- Run this once in your Neon SQL Editor before enabling collection.

CREATE TABLE IF NOT EXISTS repositories (
  full_name TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'Unknown',
  url TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repo_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  repo_full_name TEXT NOT NULL REFERENCES repositories(full_name) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 0),
  forks INTEGER NOT NULL DEFAULT 0 CHECK (forks >= 0),
  snapshot_day DATE NOT NULL DEFAULT CURRENT_DATE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT repo_snapshots_repo_day_unique UNIQUE (repo_full_name, snapshot_day)
);

CREATE INDEX IF NOT EXISTS repo_snapshots_repo_captured_idx
  ON repo_snapshots (repo_full_name, captured_at DESC);
