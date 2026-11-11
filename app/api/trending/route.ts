import { NextRequest, NextResponse } from "next/server";
import { fetchTrending } from "@/lib/github-trending";

export const revalidate = 900;

export async function GET(request: NextRequest) {
  const rawPeriod = request.nextUrl.searchParams.get("since") || "daily";
  const period = (["daily", "weekly", "monthly"].includes(rawPeriod) ? rawPeriod : "daily") as "daily" | "weekly" | "monthly";

  try {
    const repositories = await fetchTrending(period);
    return NextResponse.json(
      {
        source: "github.com/trending",
        period,
        fetchedAt: new Date().toISOString(),
        repositories: repositories.map((repo) => ({
          ...repo,
          stars: repo.stars.toLocaleString("en-US"),
          forks: repo.forks.toLocaleString("en-US"),
          today: `+${repo.periodGain.toLocaleString("en-US")}`,
          todayCount: repo.periodGain,
          color: "",
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch GitHub Trending.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
