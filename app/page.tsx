"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Bookmark, CircleDot, ExternalLink, Flame, Github, Search, Star, TrendingUp, Zap, GitCompare } from "lucide-react";

type Repo = {
  name: string;
  description: string;
  language: string;
  stars: string;
  forks: string;
  today: string;
  todayCount: number;
  url: string;
  color: string;
  momentumScore: number;
};

const languageColors: Record<string, string> = {
  Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a",
  Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d",
  "C#": "#178600", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
};

const periods = [
  { label: "今日", value: "daily" },
  { label: "本周", value: "weekly" },
  { label: "本月", value: "monthly" },
];

export default function Home() {
  const [period, setPeriod] = useState("daily");
  const [language, set主要语言] = useState("全部语言");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("趋势榜");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, set仓库对比] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("pulse-watchlist");
      if (stored) setSaved(JSON.parse(stored) as string[]);
    } catch { /* Ignore unavailable or invalid local storage. */ }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pulse-watchlist", JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    const controller = new AbortController();
    async function load趋势榜() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/trending?since=${period}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load GitHub 趋势榜.");
        setRepos(payload.repositories);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load趋势榜();
    return () => controller.abort();
  }, [period]);

  const languages = useMemo(() => ["全部语言", ...Array.from(new Set(repos.map((repo) => repo.language).filter((item) => item && item !== "Unknown"))).sort()], [repos]);
  const filtered = useMemo(() => {
    const matches = repos.filter((repo) =>
      (language === "全部语言" || repo.language === language) &&
      (repo.name + " " + repo.description).toLowerCase().includes(query.toLowerCase())
    );
    if (tab === "收藏夹") return matches.filter((repo) => saved.includes(repo.name));
    if (tab === "热度势能") return [...matches].sort((a, b) => b.momentumScore - a.momentumScore);
    if (tab === "新星项目") return [...matches].sort((a, b) => b.todayCount - a.todayCount);
    return matches;
  }, [repos, language, query, tab, saved]);

  const toggleSaved = (name: string) => setSaved((current) =>
    current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
  );

  const toggle仓库对比 = (name: string) => set仓库对比((current) =>
    current.includes(name) ? current.filter((item) => item !== name) : current.length < 5 ? [...current, name] : current
  );

  return (
    <main className="shell grid-bg min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-9 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-slate-950"><Activity size={22} strokeWidth={2.6}/></div><div><div className="text-lg font-bold tracking-tight text-white">PULSE<span className="accent">.</span></div><div className="text-[10px] uppercase tracking-[.22em] muted">GitHub 开源情报</div></div></div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs text-emerald-200 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#5ee0b5]"/> GitHub 实时趋势</div>
          <div className="flex items-center gap-2"><a href="/compare" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">仓库对比</a><a href="/history" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Star 历史</a><a href="https://github.com/trending" target="_blank" rel="noreferrer" aria-label="Open GitHub 趋势榜" className="rounded-lg border border-white/10 p-2.5 text-slate-300 hover:bg-white/5"><Github size={17}/></a></div>
        </header>

        <section className="pb-8 pt-10 md:pt-14"><div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.2em] accent"><Zap size={13}/> 开源项目风向标</div><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><h1 className="max-w-3xl text-4xl font-semibold tracking-[-.045em] text-white md:text-5xl">发现正在崛起的项目。<br/><span className="text-slate-500">抢先一步。</span></h1><p className="mt-4 max-w-xl text-sm leading-6 muted">Explore the repositories trending on GitHub right now. 仓库对比 daily, weekly, and monthly momentum, then save the projects worth watching.</p></div><div className="flex gap-2"><div className="panel rounded-xl px-4 py-3"><div className="text-[10px] uppercase tracking-wider muted">仓库数量</div><div className="mt-1 text-xl font-semibold text-white">{loading ? "…" : repos.length}</div></div><div className="panel rounded-xl px-4 py-3"><div className="text-[10px] uppercase tracking-wider muted">我的收藏</div><div className="mt-1 text-xl font-semibold text-white">{saved.length}</div></div></div></div></section>

        <section className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{label:"趋势仓库",value:loading ? "…" : repos.length,hint:"来自 GitHub 趋势榜",icon:Flame},{label:"编程语言",value:languages.length - 1,hint:"编程语言 in this period",icon:CircleDot},{label:"Star 增长量",value:loading ? "…" : (repos.reduce((sum, repo) => sum + repo.todayCount, 0)).toLocaleString(),hint:"所选周期新增 Star 数",icon:趋势榜Up},{label:"收藏夹",value:saved.length,hint:"保存在当前浏览器",icon:Bookmark}].map((item) => <div key={item.label} className="panel rounded-2xl p-4"><div className="flex items-center justify-between"><span className="text-xs muted">{item.label}</span><item.icon size={16} className="text-emerald-300"/></div><div className="mt-3 text-2xl font-semibold text-white">{item.value}</div><div className="mt-1 text-[11px] muted">{item.hint}</div></div>)}
        </section>

        <section className="panel overflow-hidden rounded-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-white">发现优质仓库</h2><span className="rounded-md bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-200">实时数据</span></div><p className="mt-1 text-xs muted">数据来自 GitHub 趋势榜 · 短暂缓存以减少上游请求</p></div><div className="relative w-full md:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 muted"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索仓库…" className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"/></div></div>
          <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-5 py-3 md:flex-row md:items-center"><div className="flex flex-wrap gap-1">{["趋势榜", "热度势能", "新星项目", "收藏夹"].map((name) => <button key={name} onClick={() => setTab(name)} className={`rounded-lg px-3 py-2 text-xs transition ${tab === name ? "bg-emerald-300 text-slate-950 font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{name}</button>)}</div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-white/10 p-1">{periods.map((item) => <button key={item.value} onClick={() => setPeriod(item.value)} className={`rounded-md px-2.5 py-1.5 text-[11px] ${period === item.value ? "bg-white/10 text-white" : "muted"}`}>{item.label}</button>)}</div><select value={language} onChange={(e) => set主要语言(e.target.value)} className="rounded-lg border border-white/10 bg-[#111827] py-2 pl-3 pr-3 text-xs text-slate-300 outline-none">{languages.map((item) => <option key={item}>{item}</option>)}</select></div></div>
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_90px_88px] gap-4 px-6 py-3 text-[10px] uppercase tracking-wider muted md:grid"><div>仓库</div><div>Star 数</div><div>周期新增</div><div>主要语言</div><div/></div>
          {error ? <div className="px-6 py-14 text-center"><p className="text-sm text-rose-300">{error}</p><button onClick={() => window.location.reload()} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">重试</button></div> : loading ? <div className="px-6 py-16 text-center text-sm muted">Loading live GitHub 趋势榜…</div> : <div className="divide-y divide-white/[0.06]">{filtered.map((repo, index) => <article key={repo.name} className="grid gap-3 px-5 py-5 transition hover:bg-white/[0.025] md:grid-cols-[minmax(0,1fr)_110px_110px_90px_88px] md:items-center md:gap-4 md:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-[10px] muted">{String(index+1).padStart(2,"0")}</span><a href={`/repo/${repo.name}`} className="truncate text-sm font-semibold text-slate-100 hover:text-emerald-300" title={`View ${repo.name} details`}>{repo.name} <ExternalLink size={11} className="ml-1 inline muted"/></a><span className="rounded-md border border-emerald-300/20 bg-emerald-300/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200" title="榜单内相对热度分，不代表未来表现">{repo.momentumScore} pts</span></div><p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 muted">{repo.description || "暂无项目介绍。"}</p></div><div className="flex items-center gap-1.5 text-xs text-slate-300 md:block"><span className="md:hidden muted">Star 数</span><Star size={13} className="accent md:mr-1 md:inline"/>{repo.stars}</div><div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 md:block"><span className="md:hidden muted">周期新增</span><ArrowUpRight size={14} className="md:mr-1 md:inline"/>{repo.today}</div><div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full" style={{background: languageColors[repo.language] || "#8995a9"}}/>{repo.language}</div><div className="flex items-center gap-1"><button onClick={() => toggle仓库对比(repo.name)} disabled={!compare.includes(repo.name) && compare.length >= 5} aria-label={compare.includes(repo.name) ? "取消对比" : "加入对比"} title={compare.length >= 5 && !compare.includes(repo.name) ? "最多对比 5 个仓库" : "仓库对比"} className={`rounded-lg border p-2 transition ${compare.includes(repo.name) ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-slate-500 hover:text-white disabled:opacity-30"}`}><Git仓库对比 size={15}/></button><button onClick={() => toggleSaved(repo.name)} aria-label={saved.includes(repo.name) ? "取消收藏" : "加入收藏"} className={`rounded-lg border p-2 transition ${saved.includes(repo.name) ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-slate-500 hover:text-white"}`}><Bookmark size={15} fill={saved.includes(repo.name) ? "currentColor" : "none"}/></button></div></article>)}{filtered.length === 0 && <div className="px-6 py-14 text-center text-sm muted">{tab === "收藏夹" ? "我的收藏 is empty for this period." : "没有符合筛选条件的仓库。"}</div>}</div>}
          <div className="flex flex-col justify-between gap-2 border-t border-white/[0.07] px-5 py-4 text-[11px] muted sm:flex-row sm:items-center"><span>当前显示 {filtered.length} 个仓库 · {periods.find((item) => item.value === period)?.label} · 热度势能 is a relative heuristic</span><span className="flex items-center gap-1.5"><CircleDot size={11} className="text-emerald-300"/> 数据来源：github.com/trending</span></div>
        </section>
        {compare.length > 0 && <div className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-300/20 bg-[#111827]/95 px-4 py-3 shadow-2xl backdrop-blur"><span className="text-xs text-slate-200">{compare.length}/5 个已选</span><button onClick={() => set仓库对比([])} className="text-xs muted hover:text-white">清空</button><a href={compare.length >= 2 ? `/compare?repos=${encodeURIComponent(compare.join(","))}` : "#"} onClick={(e) => { if(compare.length < 2) e.preventDefault(); }} className={`rounded-lg px-4 py-2 text-xs font-semibold ${compare.length >= 2 ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-500"}`}>仓库对比 repositories</a></div>}
        <footer className="flex flex-col justify-between gap-2 py-7 text-[10px] muted sm:flex-row"><span className="flex items-center gap-2"><Github size={13}/> PULSE · GitHub 趋势榜 Monitor</span><span>帮助你发现开源世界中的潜力项目。</span></footer>
      </div>
    </main>
  );
}
