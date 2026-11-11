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
        repositories: (() => {
          const maxGain = Math.max(1, ...repositories.map((repo) => repo.periodGain));
          return repositories.map((repo) => {
            const gainScore = (Math.log1p(repo.periodGain) / Math.log1p(maxGain)) * 60;
            const previousStars = Math.max(repo.stars - repo.periodGain, 1);
            const growthRate = Math.min(0.3, repo.periodGain / previousStars);
            const growthScore = (growthRate / 0.3) * 25;
            const forkRatio = Math.min(0.3, repo.forks / Math.max(repo.stars, 1));
            const forkScore = (forkRatio / 0.3) * 15;
            const momentumScore = Math.round(Math.min(100, gainScore + growthScore + forkScore));
            return {
              ...repo,
              stars: repo.stars.toLocaleString("en-US"),
              forks: repo.forks.toLocaleString("en-US"),
              today: `+${repo.periodGain.toLocaleString("en-US")}`,
              todayCount: repo.periodGain,
              momentumScore,
              color: "",
            };
          });
        })(),
      },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch GitHub Trending.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
