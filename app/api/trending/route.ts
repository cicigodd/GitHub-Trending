import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 900;

const parseCount = (value: string): number => {
  const normalized = value.trim().replace(/,/g, "");
  const match = normalized.match(/^([\d.]+)\s*([kKmM])?$/);
  if (!match) return Number.parseInt(normalized, 10) || 0;
  const amount = Number(match[1]);
  const multiplier = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2]?.toLowerCase() === "k" ? 1_000 : 1;
  return Math.round(amount * multiplier);
};

const formatCount = (value: number) => value.toLocaleString("en-US");

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since") || "daily";
  const period = ["daily", "weekly", "monthly"].includes(since) ? since : "daily";

  try {
    const response = await fetch(`https://github.com/trending?since=${period}`, {
      headers: {
        "User-Agent": "Pulse-GitHub-Trending-Monitor/1.0",
        Accept: "text/html",
      },
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: `GitHub returned HTTP ${response.status}.` }, { status: 502 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const repositories: Array<{
      name: string; description: string; language: string; stars: string;
      forks: string; today: string; todayCount: number; url: string;
    }> = [];

    $("article.Box-row").each((_, element) => {
      const row = $(element);
      const link = row.find("h2 a").first();
      const path = (link.attr("href") || "").trim();
      const name = path.replace(/^\//, "").replace(/\/$/, "").replace(/\s+/g, "");
      if (!name.includes("/")) return;

      const starsText = row.find('a[href$="/stargazers"]').first().text().trim();
      const forksText = row.find('a[href$="/forks"]').first().text().trim();
      const todayText = row.find("span").toArray()
        .map((span) => $(span).text().replace(/\s+/g, " ").trim())
        .find((text) => /stars? today/i.test(text)) || "0 stars today";
      const todayMatch = todayText.match(/([\d,.]+\s*[kKmM]?)\s+stars? today/i);
      const todayCount = todayMatch ? parseCount(todayMatch[1]) : 0;

      repositories.push({
        name,
        description: row.find("p").first().text().replace(/\s+/g, " ").trim(),
        language: row.find('[itemprop="programmingLanguage"]').first().text().trim() || "Unknown",
        stars: formatCount(parseCount(starsText)),
        forks: formatCount(parseCount(forksText)),
        today: `+${formatCount(todayCount)}`,
        todayCount,
        url: `https://github.com/${name}`,
      });
    });

    if (repositories.length === 0) {
      return NextResponse.json({ error: "GitHub Trending page format changed or returned no repositories." }, { status: 502 });
    }

    return NextResponse.json(
      { source: "github.com/trending", period, fetchedAt: new Date().toISOString(), repositories },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json({ error: "Unable to reach GitHub Trending. Please try again shortly." }, { status: 502 });
  }
}
