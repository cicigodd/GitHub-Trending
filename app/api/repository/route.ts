import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo")?.trim() || "";
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return NextResponse.json({ error: "Provide a valid repository as owner/name." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo.split("/").map(encodeURIComponent).join("/")}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Pulse-GitHub-Trending-Monitor/1.0",
      },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      const message = response.status === 404 ? "Repository not found or is private." :
        response.status === 403 ? "GitHub API rate limit reached. Please try again later." :
        `GitHub API returned HTTP ${response.status}.`;
      return NextResponse.json({ error: message }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json({
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      htmlUrl: data.html_url,
      homepage: data.homepage,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.subscribers_count,
      openIssues: data.open_issues_count,
      license: data.license?.spdx_id || data.license?.name || null,
      topics: data.topics || [],
      defaultBranch: data.default_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
      archived: data.archived,
      fork: data.fork,
      owner: { login: data.owner?.login, avatarUrl: data.owner?.avatar_url, htmlUrl: data.owner?.html_url },
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
  } catch {
    return NextResponse.json({ error: "Unable to reach GitHub API." }, { status: 502 });
  }
}
