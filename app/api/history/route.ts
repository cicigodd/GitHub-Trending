import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo")?.trim() || "";
  const rawDays = Number(request.nextUrl.searchParams.get("days") || "30");
  const days = Number.isFinite(rawDays) ? Math.min(365, Math.max(1, Math.floor(rawDays))) : 30;

  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    return NextResponse.json({ error: "Provide repo as owner/name." }, { status: 400 });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT captured_at, stars, forks
      FROM repo_snapshots
      WHERE repo_full_name = ${repo}
        AND captured_at >= NOW() - (${days} * INTERVAL '1 day')
      ORDER BY captured_at ASC
    `;
    return NextResponse.json({
      repository: repo,
      days,
      points: rows.map((row) => ({
        capturedAt: row.captured_at,
        stars: Number(row.stars),
        forks: Number(row.forks),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load repository history.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
