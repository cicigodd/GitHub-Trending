"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, ExternalLink, GitFork, Globe, Scale, Star, Eye, CircleDot, CalendarDays, Clock3, AlertCircle } from "lucide-react";

type Repository = {
  fullName: string; description: string | null; htmlUrl: string; homepage: string | null;
  language: string | null; stars: number; forks: number; watchers: number; openIssues: number;
  license: string | null; topics: string[]; defaultBranch: string; createdAt: string;
  updatedAt: string; pushedAt: string; archived: boolean; fork: boolean;
  owner: { login: string; avatarUrl: string; htmlUrl: string };
};
type Point = { capturedAt: string; stars: number; forks: number };

function date(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function RepositoryPage() {
  const params = useParams<{ owner: string; name: string }>();
  const fullName = `${params.owner}/${params.name}`;
  const [repo, setRepo] = useState<Repository | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/repository?repo=${encodeURIComponent(fullName)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load repository.");
        setRepo(payload);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [fullName]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/history?repo=${encodeURIComponent(fullName)}&days=365`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load history.");
        setPoints(payload.points || []);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") setHistoryError(err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [fullName]);

  const chart = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((point) => point.stars);
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
    const coords = values.map((value, index) => ({
      x: values.length === 1 ? 400 : 24 + index / (values.length - 1) * 752,
      y: 174 - (value - min) / range * 140,
    }));
    return { line: coords.map((p) => `${p.x},${p.y}`).join(" "), min, max,
      change: values[values.length - 1] - values[0], first: points[0], last: points[points.length - 1] };
  }, [points]);

  return (
    <main className="shell grid-bg min-h-screen">
      <div className="mx-auto max-w-[1120px] px-5 py-6 md:px-9 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/" className="flex items-center gap-3 text-slate-200 hover:text-emerald-300"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-slate-950"><Activity size={22}/></div><div><div className="text-lg font-bold tracking-tight text-white">PULSE<span className="accent">.</span></div><div className="text-[10px] uppercase tracking-[.22em] muted">GitHub intelligence</div></div></Link>
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back to trending</Link>
        </header>

        {loading ? <div className="py-24 text-center text-sm muted">Loading repository details…</div> :
        error ? <div className="panel mt-10 rounded-2xl p-8 text-center"><AlertCircle className="mx-auto mb-3 text-rose-300"/><p className="text-sm text-rose-200">{error}</p><Link href="/" className="mt-5 inline-block text-xs accent">Return to trending</Link></div> :
        repo && <>
          <section className="pt-12 pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs muted"><span className="rounded-md border border-white/10 px-2 py-1">Repository</span>{repo.archived && <span className="rounded-md bg-amber-300/10 px-2 py-1 text-amber-200">Archived</span>}{repo.fork && <span className="rounded-md border border-white/10 px-2 py-1">Fork</span>}</div>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div className="min-w-0"><div className="flex items-center gap-3"><img src={repo.owner.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-white/10"/><div><p className="text-xs muted">{repo.owner.login}</p><h1 className="break-all text-3xl font-semibold tracking-tight text-white md:text-4xl">{repo.name}</h1></div></div><p className="mt-5 max-w-3xl text-sm leading-6 muted">{repo.description || "No description provided."}</p>
                <div className="mt-4 flex flex-wrap gap-2">{repo.topics.map((topic) => <span key={topic} className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1 text-[11px] text-emerald-200">{topic}</span>)}</div>
              </div>
              <div className="flex flex-wrap gap-2"><a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-200">Open on GitHub <ExternalLink size={13}/></a>{repo.homepage && <a href={repo.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs text-slate-200 hover:bg-white/5"><Globe size={13}/> Website</a>}</div>
            </div>
          </section>

          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{label:"Stars",value:repo.stars.toLocaleString(),icon:Star},{label:"Forks",value:repo.forks.toLocaleString(),icon:GitFork},{label:"Watchers",value:repo.watchers.toLocaleString(),icon:Eye},{label:"Open issues",value:repo.openIssues.toLocaleString(),icon:CircleDot}].map((item) => <div key={item.label} className="panel rounded-2xl p-4"><div className="flex items-center justify-between text-xs muted"><span>{item.label}</span><item.icon size={16} className="accent"/></div><div className="mt-3 text-2xl font-semibold text-white">{item.value}</div></div>)}
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)]">
            <div className="panel rounded-2xl p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-white">Star growth</h2><p className="mt-1 text-xs muted">Daily snapshots · Last 365 days</p></div><Star size={17} className="accent"/></div>
              {historyLoading ? <div className="py-16 text-center text-xs muted">Loading historical data…</div> :
              historyError ? <div className="py-12 text-center text-xs text-rose-300">{historyError}</div> :
              chart ? <><div className="mt-6 flex items-end justify-between gap-3"><div><div className="text-2xl font-semibold text-white">{chart.last.stars.toLocaleString()}</div><div className="text-[11px] muted">Latest recorded stars</div></div><div className={chart.change >= 0 ? "text-right text-xs text-emerald-300" : "text-right text-xs text-rose-300"}>{chart.change >= 0 ? "+" : ""}{chart.change.toLocaleString()} <span className="muted">since first snapshot</span></div></div><div className="mt-5 rounded-xl border border-white/[.06] bg-black/10 p-3"><div className="flex justify-between text-[10px] muted"><span>{chart.min.toLocaleString()}</span><span>{chart.max.toLocaleString()}</span></div><svg viewBox="0 0 800 190" role="img" aria-label={`Star growth for ${repo.fullName}`} className="mt-3 w-full"><line x1="24" y1="174" x2="776" y2="174" stroke="rgba(148,163,184,.2)" strokeDasharray="4 5"/><polyline points={chart.line} fill="none" stroke="#5ee0b5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="flex justify-between text-[10px] muted"><span>{date(chart.first.capturedAt)}</span><span>{date(chart.last.capturedAt)}</span></div></div><p className="mt-3 text-[11px] muted">{points.length} snapshots recorded</p></> :
              <div className="py-12 text-center"><Star size={22} className="mx-auto mb-3 text-slate-500"/><p className="text-sm text-slate-300">No historical snapshots yet</p><p className="mt-2 text-xs muted">The chart will appear after the collector records this repository.</p><Link href="/history" className="mt-4 inline-block text-xs accent">Open history explorer</Link></div>}
            </div>

            <aside className="panel rounded-2xl p-5 md:p-6"><h2 className="text-base font-semibold text-white">Repository details</h2><div className="mt-5 space-y-4 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="muted">Primary language</span><span className="text-slate-200">{repo.language || "Not specified"}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="muted flex items-center gap-2"><Scale size={13}/> License</span><span className="text-slate-200">{repo.license || "Not specified"}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="muted">Default branch</span><span className="font-mono text-slate-200">{repo.defaultBranch}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="muted flex items-center gap-2"><CalendarDays size={13}/> Created</span><span className="text-slate-200">{date(repo.createdAt)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="muted flex items-center gap-2"><Clock3 size={13}/> Last pushed</span><span className="text-slate-200">{date(repo.pushedAt)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="muted">Last updated</span><span className="text-slate-200">{date(repo.updatedAt)}</span></div>
            </div><a href={repo.owner.htmlUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center gap-3 border-t border-white/[.07] pt-5"><img src={repo.owner.avatarUrl} alt="" className="h-8 w-8 rounded-full"/><div><div className="text-xs font-medium text-slate-200">{repo.owner.login}</div><div className="mt-1 text-[10px] muted">View maintainer profile</div></div><ExternalLink size={12} className="ml-auto muted"/></a></aside>
          </section>
        </>}
        <footer className="py-7 text-[10px] muted">PULSE · Repository intelligence powered by GitHub API and collected snapshots.</footer>
      </div>
    </main>
  );
}
