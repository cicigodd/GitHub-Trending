import { NextRequest, NextResponse } from "next/server";
import { fetchTrending } from "@/lib/github-trending";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const sql = getSql();
    const repositories = await fetchTrending("daily");

    for (const repo of repositories) {
      await sql`
        INSERT INTO repositories (full_name, description, language, url, first_seen_at, last_seen_at)
        VALUES (${repo.name}, ${repo.description}, ${repo.language}, ${repo.url}, NOW(), NOW())
        ON CONFLICT (full_name) DO UPDATE SET
          description = EXCLUDED.description,
          language = EXCLUDED.language,
          url = EXCLUDED.url,
          last_seen_at = NOW()
      `;
      await sql`
        INSERT INTO repo_snapshots (repo_full_name, stars, forks, snapshot_day, captured_at)
        VALUES (${repo.name}, ${repo.stars}, ${repo.forks}, CURRENT_DATE, NOW())
        ON CONFLICT (repo_full_name, snapshot_day) DO UPDATE SET
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks,
          captured_at = NOW()
      `;
    }

    return NextResponse.json({
      status: "ok",
      collected: repositories.length,
      capturedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot collection failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
