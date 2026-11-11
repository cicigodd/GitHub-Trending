"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, BarChart3, CalendarDays, Search, Star } from "lucide-react";

type Point = { capturedAt: string; stars: number; forks: number };
type HistoryResponse = { repository: string; days: number; points: Point[]; error?: string };

export default function HistoryPage() {
  const [repository, setRepository] = useState("vercel/next.js");
  const [days, setDays] = useState("30");
  const [points, setPoints] = useState<Point[]>([]);
  const [loadedRepo, setLoadedRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function loadHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const repo = repository.trim();
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
      setError("Enter a repository in owner/name format.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const response = await fetch(`/api/history?repo=${encodeURIComponent(repo)}&days=${days}`);
      const payload = (await response.json()) as HistoryResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load history.");
      setPoints(payload.points);
      setLoadedRepo(repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load history.");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }

  const chart = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((point) => point.stars);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const coords = values.map((value, index) => ({
      x: 24 + (index / (values.length - 1)) * 752,
      y: 176 - ((value - min) / range) * 140,
    }));
    return {
      line: coords.map((point) => `${point.x},${point.y}`).join(" "),
      area: `24,176 ${coords.map((point) => `${point.x},${point.y}`).join(" ")} 776,176`,
      min,
      max,
      change: values[values.length - 1] - values[0],
    };
  }, [points]);

  return (
    <main className="shell grid-bg min-h-screen">
      <div className="mx-auto max-w-[1100px] px-5 py-6 md:px-9 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/" className="flex items-center gap-3 text-slate-200 hover:text-emerald-300"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-slate-950"><Activity size={22}/></div><div><div className="text-lg font-bold tracking-tight text-white">PULSE<span className="accent">.</span></div><div className="text-[10px] uppercase tracking-[.22em] muted">GitHub intelligence</div></div></Link>
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back to trending</Link>
        </header>

        <section className="pt-12 pb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.2em] accent"><BarChart3 size={14}/> Historical intelligence</div>
          <h1 className="text-4xl font-semibold tracking-[-.045em] text-white md:text-5xl">Star history.<br/><span className="text-slate-500">Measured over time.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 muted">View the daily star and fork snapshots collected by Pulse. History begins when the collector first runs; it cannot recreate earlier counts.</p>
        </section>

        <section className="panel rounded-2xl p-5 md:p-6">
          <form onSubmit={loadHistory} className="flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1"><span className="sr-only">Repository</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 muted"/><input value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repository" className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"/></label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-400"><CalendarDays size={14}/><select value={days} onChange={(event) => setDays(event.target.value)} className="bg-transparent py-3 text-slate-200 outline-none"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option></select></label>
            <button type="submit" disabled={loading} className="rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-50">{loading ? "Loading…" : "View history"}</button>
          </form>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          {!error && searched && !loading && points.length === 0 && <div className="py-14 text-center"><Star size={24} className="mx-auto mb-3 text-slate-500"/><p className="text-sm text-slate-300">No snapshots found for {loadedRepo || repository}.</p><p className="mt-2 text-xs muted">Run the collector and wait for daily snapshots to accumulate.</p></div>}
          {chart && <div className="mt-7">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="text-sm font-semibold text-white">{loadedRepo}</div><div className="mt-1 text-xs muted">{points.length} daily snapshots</div></div><div className="text-right"><div className="text-2xl font-semibold text-white">{points[points.length - 1].stars.toLocaleString()}</div><div className={`mt-1 text-xs ${chart.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{chart.change >= 0 ? "+" : ""}{chart.change.toLocaleString()} stars since first snapshot</div></div></div>
            <div className="panel rounded-xl p-3 md:p-5">
              <div className="mb-3 flex justify-between text-[10px] muted"><span>{chart.min.toLocaleString()} stars</span><span>{chart.max.toLocaleString()} stars</span></div>
              <svg viewBox="0 0 800 200" role="img" aria-label={`Star count history for ${loadedRepo}`} className="w-full overflow-visible">
                <defs><linearGradient id="historyFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#5ee0b5" stopOpacity=".25"/><stop offset="100%" stopColor="#5ee0b5" stopOpacity="0"/></linearGradient></defs>
                <line x1="24" y1="176" x2="776" y2="176" stroke="rgba(148,163,184,.2)" strokeDasharray="4 5"/>
                <polygon points={chart.area} fill="url(#historyFill)"/>
                <polyline points={chart.line} fill="none" stroke="#5ee0b5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mt-2 flex justify-between text-[10px] muted"><span>{new Date(points[0].capturedAt).toLocaleDateString()}</span><span>{new Date(points[points.length - 1].capturedAt).toLocaleDateString()}</span></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="panel rounded-xl p-4"><div className="text-xs muted">Latest stars</div><div className="mt-2 text-xl font-semibold text-white">{points[points.length - 1].stars.toLocaleString()}</div></div><div className="panel rounded-xl p-4"><div className="text-xs muted">Latest forks</div><div className="mt-2 text-xl font-semibold text-white">{points[points.length - 1].forks.toLocaleString()}</div></div></div>
          </div>}
          {!searched && <div className="py-14 text-center text-sm muted">Enter a GitHub repository to inspect its recorded history.</div>}
        </section>
        <footer className="py-7 text-[10px] muted">PULSE · Historical data is based on snapshots collected after database setup.</footer>
      </div>
    </main>
  );
}
