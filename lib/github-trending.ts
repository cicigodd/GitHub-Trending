import * as cheerio from "cheerio";

export type TrendingRepository = {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  periodGain: number;
  url: string;
};

const parseCount = (value: string): number => {
  const normalized = value.trim().replace(/,/g, "");
  const match = normalized.match(/^([\d.]+)\s*([kKmM])?$/);
  if (!match) return Number.parseInt(normalized, 10) || 0;
  const amount = Number(match[1]);
  const multiplier = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2]?.toLowerCase() === "k" ? 1_000 : 1;
  return Math.round(amount * multiplier);
};

export async function fetchTrending(period: "daily" | "weekly" | "monthly") {
  const response = await fetch(`https://github.com/trending?since=${period}`, {
    headers: { "User-Agent": "Pulse-GitHub-Trending-Monitor/1.0", Accept: "text/html" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);

  const $ = cheerio.load(await response.text());
  const repositories: TrendingRepository[] = [];

  $("article.Box-row").each((_, element) => {
    const row = $(element);
    const path = (row.find("h2 a").first().attr("href") || "").trim();
    const name = path.replace(/^\//, "").replace(/\/$/, "").replace(/\s+/g, "");
    if (!name.includes("/")) return;

    const periodLabel = period === "daily" ? "today" : period === "weekly" ? "this week" : "this month";
    const periodText = row.find("span").toArray()
      .map((span) => $(span).text().replace(/\s+/g, " ").trim())
      .find((text) => new RegExp(`stars? ${periodLabel.replace(" ", "\\s+")}`, "i").test(text)) || `0 stars ${periodLabel}`;
    const periodMatch = periodText.match(new RegExp(`([\\d,.]+\\s*[kKmM]?)\\s+stars? ${periodLabel.replace(" ", "\\s+")}`, "i"));

    repositories.push({
      name,
      description: row.find("p").first().text().replace(/\s+/g, " ").trim(),
      language: row.find('[itemprop="programmingLanguage"]').first().text().trim() || "Unknown",
      stars: parseCount(row.find('a[href$="/stargazers"]').first().text()),
      forks: parseCount(row.find('a[href$="/forks"]').first().text()),
      periodGain: periodMatch ? parseCount(periodMatch[1]) : 0,
      url: `https://github.com/${name}`,
    });
  });

  if (repositories.length === 0) {
    throw new Error("GitHub Trending page format changed or returned no repositories.");
  }
  return repositories;
}
