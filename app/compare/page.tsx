"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ExternalLink, GitFork, Star, Eye, CircleDot, Scale, AlertCircle } from "lucide-react";

type Repo = { fullName:string; description:string|null; htmlUrl:string; language:string|null; stars:number; forks:number; watchers:number; openIssues:number; license:string|null; topics:string[]; createdAt:string; pushedAt:string; owner:{login:string;avatarUrl:string} };
const number = (n:number) => n.toLocaleString();
export default function ComparePage() {
  const [names,setNames]=useState<string[]>([]);
  useEffect(()=>{ const params=new URLSearchParams(window.location.search); setNames(Array.from(new Set((params.get("repos")||"").split(",").filter(Boolean))).slice(0,5)); },[]);
  const [repos,setRepos]=useState<Repo[]>([]);
  const [loading,setLoading]=useState(true);
  const [errors,setErrors]=useState<string[]>([]);
  useEffect(()=>{
    if(names.length===0){setLoading(false);return;}
    const controller=new AbortController();
    Promise.all(names.map(async name=>{
      const response=await fetch(`/api/repository?repo=${encodeURIComponent(name)}`,{signal:controller.signal});
      const data=await response.json();
      if(!response.ok) throw new Error(`${name}: ${data.error||"加载失败"}`);
      return data as Repo;
    })).then(setRepos).catch((error:unknown)=>{
      if(error instanceof Error && error.name!=="AbortError") setErrors([error.message]);
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[names.join("|")]);
  const metrics=[{label:"Star 数",key:"stars" as const,icon:Star},{label:"Fork 数",key:"forks" as const,icon:GitFork},{label:"关注者",key:"watchers" as const,icon:Eye},{label:"未关闭 Issue",key:"openIssues" as const,icon:CircleDot}];
  return <main className="shell grid-bg min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-6 md:px-9 lg:px-12">
    <header className="flex items-center justify-between border-b border-white/[0.08] pb-6"><Link href="/" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-slate-950"><Activity size={22}/></div><div><div className="text-lg font-bold text-white">PULSE<span className="accent">.</span></div><div className="text-[10px] uppercase tracking-[.22em] muted">仓库对比</div></div></Link><Link href="/" className="flex items-center gap-2 text-xs muted hover:text-white"><ArrowLeft size={14}/> 返回趋势榜</Link></header>
    <section className="py-10"><p className="text-xs uppercase tracking-[.2em] accent">多仓库横向分析</p><h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">对比仓库</h1><p className="mt-3 text-sm muted">对比 GitHub 当前指标和项目资料。请从趋势榜中选择最多 5 个仓库。</p></section>
    {loading?<div className="panel rounded-2xl p-12 text-center text-sm muted">正在加载对比数据…</div>:errors.length>0?<div className="panel rounded-2xl p-8 text-sm text-rose-200"><AlertCircle className="mb-3"/>{errors.join("; ")}</div>:repos.length===0?<div className="panel rounded-2xl p-10 text-center"><p className="text-sm text-slate-200">尚未选择要对比的仓库。</p><Link href="/" className="mt-4 inline-block text-xs accent">返回选择仓库</Link></div>:<>
      <div className="grid gap-3" style={{gridTemplateColumns:`repeat(${repos.length}, minmax(0,1fr))`}}>{repos.map(repo=><div key={repo.fullName} className="panel min-w-0 rounded-2xl p-4 md:p-5"><div className="flex items-center gap-2"><img src={repo.owner.avatarUrl} alt="" className="h-7 w-7 rounded-full"/><span className="truncate text-xs muted">{repo.owner.login}</span></div><h2 className="mt-3 break-all text-sm font-semibold text-white">{repo.fullName}</h2><p className="mt-2 min-h-10 text-xs leading-5 muted">{repo.description||"暂无项目介绍。"}</p><a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[11px] accent">打开 GitHub <ExternalLink size={11}/></a></div>)}</div>
      <section className="panel mt-5 overflow-hidden rounded-2xl"><div className="border-b border-white/[.07] p-5"><h2 className="font-semibold text-white">核心指标对比</h2><p className="mt-1 text-xs muted">数据来自 GitHub REST API 实时查询</p></div>
      {metrics.map(metric=>{const max=Math.max(1,...repos.map(r=>r[metric.key]));return <div key={metric.key} className="grid gap-4 border-b border-white/[.06] p-5 last:border-0" style={{gridTemplateColumns:`120px repeat(${repos.length}, minmax(0,1fr))`}}><div className="flex items-center gap-2 text-xs muted"><metric.icon size={14}/>{metric.label}</div>{repos.map(repo=><div key={repo.fullName} className="min-w-0"><div className="mb-2 text-sm font-semibold tabular-nums text-white">{number(repo[metric.key])}</div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-emerald-300" style={{width:`${repo[metric.key]/max*100}%`}}/></div></div>)}</div>})}
      {([{label:"主要语言",value:(r:Repo)=>r.language||"未知"},{label:"开源许可证",value:(r:Repo)=>r.license||"未注明"},{label:"创建时间",value:(r:Repo)=>new Date(r.createdAt).toLocaleDateString()},{label:"最近推送",value:(r:Repo)=>new Date(r.pushedAt).toLocaleDateString()}]).map(row=><div key={row.label} className="grid gap-4 border-b border-white/[.06] p-5 last:border-0" style={{gridTemplateColumns:`120px repeat(${repos.length}, minmax(0,1fr))`}}><div className="flex items-center gap-2 text-xs muted">{row.label==="开源许可证"?<Scale size={14}/>:null}{row.label}</div>{repos.map(repo=><div key={repo.fullName} className="break-words text-xs text-slate-200">{row.value(repo)}</div>)}</div>)}
      </section>
      <div className="mt-5 flex flex-wrap gap-2">{repos.map(repo=><Link key={repo.fullName} href={`/repo/${repo.fullName}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">{repo.fullName} 详情</Link>)}</div>
    </>}
    <footer className="py-8 text-[10px] muted">PULSE · 当前指标来自 GitHub API；历史快照由独立采集任务记录。</footer>
  </div></main>;
}
