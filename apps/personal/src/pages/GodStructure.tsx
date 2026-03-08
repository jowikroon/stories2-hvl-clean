import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import {
  Activity, Shield, Globe, Brain, Cpu, Radio, Database, HeartPulse,
  RefreshCw, Server, Zap, Layers, CheckCircle2,
  AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Network, Wifi, WifiOff, ExternalLink,
  BarChart3, ListChecks, Loader2, Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOWS } from "@/lib/config/workflows";
import { cn } from "@/lib/utils";

/* ═══ Types ═══ */

type SvcStatus = "online" | "offline" | "checking";
type Tab = "overview" | "infrastructure" | "status" | "roadmap";

interface SvcCheck { label: string; sublabel: string; status: SvcStatus; latency?: number; lastError?: string; icon: typeof Server; }
interface SystemIssue { id: string; severity: string; area: string; issue: string; impact: string; fix: string; is_resolved: boolean; sort_order: number; }
interface RoadmapItem { task: string; status: "done" | "doing" | "todo" | "blocked"; priority: "P0" | "P1" | "P2" | "P3"; category: string; effort?: string; }

/* ═══ Infrastructure layers — verified 2026-03-08 ═══ */

const INFRA_LAYERS = [
  { id: "edge", label: "Edge / CDN", tech: "Cloudflare Pages", color: "emerald",
    services: ["React 18 + Vite + TypeScript SPA", "Auto-deploy from jowikroon/hans-crafted-stories", "Cloudflare DNS + SSL", "SPA routing via _redirects"],
    urls: [{ label: "hansvanleeuwen.com", url: "https://hansvanleeuwen.com" }] },
  { id: "backend", label: "Backend", tech: "Supabase (pesfakewujjwkyybwaom)", color: "blue",
    services: ["PostgreSQL — 20 tables, 7+ migrations", "Auth — Email + Google OAuth", "Edge Functions (empire-health, site-audit, trigger-webhook, etc.)", "Row Level Security on most tables"],
    urls: [{ label: "Dashboard", url: "https://supabase.com/dashboard/project/pesfakewujjwkyybwaom" }] },
  { id: "automation", label: "Automation", tech: "n8n on Hostinger VPS", color: "purple",
    services: ["Claude Relay v2 (webhook gateway)", "Hans Site Update Engine v3 (BJ Fogg + LLM)", "4 monitoring workflows (Docker, endpoints, snapshots, changes)", `${WORKFLOWS.length} workflows in frontend registry`],
    urls: [{ label: "n8n Hostinger", url: "https://n8n.srv1402218.hstgr.cloud" }, { label: "n8n Cloud", url: "https://hansvanleeuwen.app.n8n.cloud" }] },
  { id: "compute", label: "Compute", tech: "2× Hostinger VPS", color: "amber",
    services: ["VPS1 (srv1402218) — Ubuntu 24.04, 2c / 8GB", "Docker: n8n, Traefik, AnythingLLM, Qdrant, ttyd", "VPS2 (srv1411336) — Ollama inference", "Claude Code CLI v2.1.50 on VPS1"],
    urls: [] },
  { id: "ai", label: "AI Models", tech: "Multi-provider", color: "pink",
    services: ["Claude API (via Edge Functions + relay)", "Ollama (qwen2.5:7b + 14b on VPS2)", "AnythingLLM (RAG, port 3001)", "Qdrant (vectors, port 6333)"],
    urls: [] },
];

/* ═══ Roadmap — verified against God Structure v2 doc ═══ */

const ROADMAP: RoadmapItem[] = [
  { task: "Domains live (hansvanleeuwen.com + marketplacegrowth.nl)", status: "done", priority: "P0", category: "infra" },
  { task: "Cloudflare Pages deploy pipeline", status: "done", priority: "P0", category: "infra" },
  { task: "Supabase schema — 7 migrations", status: "done", priority: "P0", category: "backend" },
  { task: "Edge Functions deployed", status: "done", priority: "P0", category: "backend" },
  { task: "Auth — email + Google OAuth", status: "done", priority: "P0", category: "auth" },
  { task: "4 VPS monitoring workflows active", status: "done", priority: "P0", category: "infra" },
  { task: "Separate repos (marketplacegrowth standalone)", status: "done", priority: "P0", category: "infra" },
  { task: "Ollama deployed on VPS2", status: "done", priority: "P1", category: "ai" },
  { task: "God Structure dashboard", status: "done", priority: "P1", category: "frontend" },
  { task: "9 infra services registered in Supabase", status: "done", priority: "P1", category: "infra" },
  { task: "Hans Site Update Engine v3", status: "done", priority: "P1", category: "automation" },
  { task: "Wire frontend to Supabase backend", status: "doing", priority: "P1", category: "frontend" },
  { task: "AutoSEO Brain v2 (connectcarparts.nl)", status: "doing", priority: "P1", category: "seo" },
  { task: "Rotate exposed GitHub PAT + Cloudflare token", status: "todo", priority: "P0", category: "security", effort: "10 min" },
  { task: "Set LLM API key in Edge Function secrets", status: "todo", priority: "P0", category: "backend", effort: "2 min" },
  { task: "Enable RLS on 6 legacy infra tables", status: "todo", priority: "P0", category: "security", effort: "30 min" },
  { task: "Enable leaked password protection", status: "todo", priority: "P0", category: "security", effort: "2 min" },
  { task: "Fix RLS auth.uid() → (select auth.uid()) — 28 policies", status: "todo", priority: "P1", category: "performance", effort: "1 hr" },
  { task: "Add missing FK indexes (6 tables)", status: "todo", priority: "P1", category: "performance", effort: "15 min" },
  { task: "Replace Lovable OAuth → Supabase Google OAuth", status: "todo", priority: "P1", category: "auth", effort: "1 hr" },
  { task: "Activate SEO News Scraper", status: "todo", priority: "P1", category: "seo", effort: "15 min" },
  { task: "Route-level code splitting", status: "todo", priority: "P2", category: "frontend", effort: "2 hr" },
  { task: "GitHub Actions CI", status: "todo", priority: "P2", category: "infra", effort: "30 min" },
  { task: "Wire Content Builder → Edge Functions", status: "todo", priority: "P2", category: "frontend", effort: "4 hr" },
  { task: "Connect monitoring → Supabase", status: "todo", priority: "P3", category: "infra", effort: "2 hr" },
  { task: "Clean up 15 inactive n8n workflows", status: "todo", priority: "P3", category: "infra", effort: "30 min" },
  { task: "Fix n8n reverse proxy 502", status: "blocked", priority: "P1", category: "infra", effort: "1 hr" },
  { task: "Deploy JSON Workflow Improver", status: "blocked", priority: "P2", category: "automation", effort: "1 hr" },
];

/* ═══ Hooks — real data from Supabase ═══ */

function useSupabaseHealth() {
  const [checks, setChecks] = useState<SvcCheck[]>([
    { label: "Database", sublabel: "PostgreSQL via PostgREST", status: "checking", icon: Database },
    { label: "Auth", sublabel: "Supabase Auth", status: "checking", icon: Shield },
    { label: "Functions", sublabel: "Deno Edge runtime", status: "checking", icon: Zap },
    { label: "API", sublabel: "REST gateway", status: "checking", icon: Globe },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const run = async () => {
    setChecking(true);
    setChecks(p => p.map(c => ({ ...c, status: "checking" as SvcStatus })));
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
    const probe = async (fn: () => Promise<{ ok: boolean; err?: string }>): Promise<{ status: SvcStatus; latency: number; lastError?: string }> => {
      const t = Date.now();
      try { const r = await fn(); return { status: r.ok ? "online" : "offline", latency: Date.now() - t, lastError: r.err }; }
      catch (e: any) { return { status: "offline", latency: Date.now() - t, lastError: e?.message }; }
    };
    const results = await Promise.all([
      probe(async () => { const { error } = await supabase.from("portal_tools").select("id").limit(1); return { ok: !error, err: error?.message }; }),
      probe(async () => { const { error } = await supabase.auth.getSession(); return { ok: !error, err: error?.message }; }),
      probe(async () => { if (!url) return { ok: false, err: "No URL" }; const r = await fetch(`${url}/functions/v1/site-audit`, { method: "OPTIONS" }); return { ok: r.ok || r.status === 204, err: r.ok ? undefined : `HTTP ${r.status}` }; }),
      probe(async () => { if (!url) return { ok: false, err: "No URL" }; const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } }); return { ok: r.ok, err: r.ok ? undefined : `HTTP ${r.status}` }; }),
    ]);
    setChecks(p => p.map((c, i) => ({ ...c, ...results[i] })));
    setLastChecked(new Date());
    setChecking(false);
  };

  useEffect(() => { run(); }, []);
  return { checks, lastChecked, checking, run };
}

function useEmpireSpine() {
  const labels = ["Shield", "Portal", "Brain", "Muscle", "Senses", "Memory", "Immune"];
  const [layers, setLayers] = useState(labels.map(l => ({ label: l, status: "checking" as SvcStatus, latency: undefined as number | undefined, error: undefined as string | undefined })));
  const [checking, setChecking] = useState(false);

  const run = async () => {
    setChecking(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (!url) { setLayers(p => p.map(l => ({ ...l, status: "offline" as SvcStatus }))); return; }
      const res = await fetch(`${url}/functions/v1/empire-health`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const d = await res.json();
      if (d.services) setLayers(p => p.map(l => { const svc = d.services[l.label.toLowerCase()]; return svc ? { ...l, status: (svc.ok ? "online" : "offline") as SvcStatus, latency: svc.latency, error: svc.error } : { ...l, status: "offline" as SvcStatus }; }));
    } catch { setLayers(p => p.map(l => ({ ...l, status: "offline" as SvcStatus }))); }
    finally { setChecking(false); }
  };

  useEffect(() => { run(); }, []);
  return { layers, checking, run };
}

function useIssues() {
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = async () => { try { const { data, error } = await (supabase.from("system_issues" as any).select("*").order("sort_order", { ascending: true }) as any); if (!error && data) setIssues(data as SystemIssue[]); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetch_(); }, []);
  const toggle = async (id: string, cur: boolean) => { await (supabase.from("system_issues" as any).update({ is_resolved: !cur } as any).eq("id", id) as any); setIssues(p => p.map(i => i.id === id ? { ...i, is_resolved: !cur } : i)); };
  return { issues, loading, toggle, refetch: fetch_ };
}

/* ═══ Tiny components ═══ */

const sIcon = (s: SvcStatus) => s === "online" ? <Wifi size={10} className="text-emerald-400" /> : s === "offline" ? <WifiOff size={10} className="text-red-400" /> : <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" />;

const priColor: Record<string, string> = { P0: "bg-red-500/15 text-red-400 border-red-500/30", P1: "bg-amber-500/15 text-amber-400 border-amber-500/30", P2: "bg-blue-500/15 text-blue-400 border-blue-500/30", P3: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
const statusEmoji: Record<string, string> = { done: "✅", doing: "🔧", todo: "📋", blocked: "⛔" };
const layerColors: Record<string, string> = { emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]", blue: "text-blue-400 border-blue-500/20 bg-blue-500/[0.06]", purple: "text-purple-400 border-purple-500/20 bg-purple-500/[0.06]", amber: "text-amber-400 border-amber-500/20 bg-amber-500/[0.06]", pink: "text-pink-400 border-pink-500/20 bg-pink-500/[0.06]" };
const catColor: Record<string, string> = { seo: "bg-emerald-500/15 text-emerald-400", data: "bg-blue-500/15 text-blue-400", infra: "bg-violet-500/15 text-violet-400", marketing: "bg-amber-500/15 text-amber-400", ai: "bg-pink-500/15 text-pink-400" };

function Kpi({ label, value, sub, cls }: { label: string; value: string; sub: string; cls: string }) {
  return (<div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">{label}</p><p className={cn("text-2xl font-bold leading-none font-mono", cls)}>{value}</p><p className="mt-1.5 text-[10px] text-zinc-500">{sub}</p></div>);
}

function Spine({ layers, checking, onRefresh }: { layers: { label: string; status: SvcStatus; latency?: number }[]; checking: boolean; onRefresh: () => void }) {
  const icons = [Shield, Globe, Brain, Cpu, Radio, Database, HeartPulse];
  const on = layers.filter(l => l.status === "online").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400/70">7-Layer Spine</h3><span className="text-[10px] text-zinc-500 font-mono">{checking ? "scanning…" : `${on}/${layers.length}`}</span></div>
        <button onClick={onRefresh} disabled={checking} className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 transition-all"><RefreshCw size={11} className={checking ? "animate-spin" : ""} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {layers.map((l, i) => { const I = icons[i] || Server; return (
          <div key={l.label} className={cn("flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3", l.status === "online" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : l.status === "offline" ? "border-red-500/20 bg-red-500/[0.04]" : "border-zinc-800 bg-zinc-900/40")}>
            <I size={16} className={l.status === "online" ? "text-emerald-400" : l.status === "offline" ? "text-red-400" : "text-zinc-600"} strokeWidth={1.5} />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">{l.label}</span>
            <div className="flex items-center gap-1">{sIcon(l.status)}{l.latency != null && l.status === "online" && <span className="text-[8px] font-mono text-emerald-400/50">{l.latency}ms</span>}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function SvcGrid({ checks, checking, onRefresh, lastChecked }: { checks: SvcCheck[]; checking: boolean; onRefresh: () => void; lastChecked: Date | null }) {
  const on = checks.filter(c => c.status === "online").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-400/70">Supabase Services</h3><span className="text-[10px] text-zinc-500 font-mono">{checking ? "checking…" : `${on}/${checks.length}`}</span>{lastChecked && <span className="text-[9px] text-zinc-600">{lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</div>
        <button onClick={onRefresh} disabled={checking} className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-30 transition-all"><RefreshCw size={11} className={checking ? "animate-spin" : ""} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {checks.map(c => { const I = c.icon; return (
          <div key={c.label} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", c.status === "online" ? "border-emerald-500/15 bg-emerald-500/[0.03]" : c.status === "offline" ? "border-red-500/15 bg-red-500/[0.03]" : "border-zinc-800")}>
            <I size={14} className={c.status === "online" ? "text-emerald-400" : c.status === "offline" ? "text-red-400" : "text-zinc-600"} />
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-zinc-300">{c.label}</p><p className="text-[10px] text-zinc-600 truncate">{c.sublabel}</p></div>
            <div className="flex flex-col items-end gap-0.5">{sIcon(c.status)}{c.latency != null && c.status === "online" && <span className="text-[9px] font-mono text-zinc-500">{c.latency}ms</span>}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function InfraCard({ layer, idx }: { layer: typeof INFRA_LAYERS[0]; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={cn("rounded-xl border transition-all cursor-pointer", layerColors[layer.color])} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3"><Layers size={14} /><div><p className="text-sm font-semibold">{layer.label}</p><p className="text-[10px] opacity-60">{layer.tech}</p></div></div>
        <ChevronDown size={14} className={cn("transition-transform opacity-40", open && "rotate-180")} />
      </div>
      <AnimatePresence>{open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
          <div className="border-t border-current/10 px-4 py-3 space-y-2">
            {layer.services.map((s, i) => (<div key={i} className="flex items-start gap-2 text-[11px] opacity-70"><ChevronRight size={10} className="mt-0.5 shrink-0" /><span>{s}</span></div>))}
            {layer.urls.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{layer.urls.map(u => (<a key={u.url} href={u.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-medium opacity-80 hover:opacity-100"><ExternalLink size={9} /> {u.label}</a>))}</div>}
          </div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}

function RoadmapTab({ items, dbIssues, dbLoading, toggle }: { items: RoadmapItem[]; dbIssues: SystemIssue[]; dbLoading: boolean; toggle: (id: string, cur: boolean) => void }) {
  const [filter, setFilter] = useState<"all" | "todo" | "doing" | "done" | "blocked">("all");
  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const c = { all: items.length, done: items.filter(i => i.status === "done").length, doing: items.filter(i => i.status === "doing").length, todo: items.filter(i => i.status === "todo").length, blocked: items.filter(i => i.status === "blocked").length };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2">
        {[
          { ph: "Security", tl: "Now", col: "border-red-500/30 bg-red-500/[0.04]", tc: "text-red-400", n: items.filter(i => i.priority === "P0" && i.status !== "done").length },
          { ph: "Core", tl: "Week 1-2", col: "border-amber-500/30 bg-amber-500/[0.04]", tc: "text-amber-400", n: items.filter(i => i.priority === "P1" && i.status !== "done").length },
          { ph: "Polish", tl: "Week 3-4", col: "border-blue-500/30 bg-blue-500/[0.04]", tc: "text-blue-400", n: items.filter(i => i.priority === "P2" && i.status !== "done").length },
          { ph: "Growth", tl: "Month 2+", col: "border-emerald-500/30 bg-emerald-500/[0.04]", tc: "text-emerald-400", n: items.filter(i => i.priority === "P3" && i.status !== "done").length },
        ].map(p => (<div key={p.ph} className={cn("rounded-lg border p-3", p.col)}><p className={cn("text-[10px] font-semibold uppercase tracking-wider", p.tc)}>Phase — {p.ph}</p><p className="text-[9px] text-zinc-500 mt-0.5">{p.tl}</p><p className={cn("text-lg font-bold font-mono mt-1", p.tc)}>{p.n}</p><p className="text-[9px] text-zinc-600">remaining</p></div>))}
      </div>

      <div className="flex gap-1">
        {([["all", `All (${c.all})`, "text-zinc-300"], ["done", `✅ Done (${c.done})`, "text-emerald-400"], ["doing", `🔧 Doing (${c.doing})`, "text-amber-400"], ["todo", `📋 To Do (${c.todo})`, "text-blue-400"], ["blocked", `⛔ Blocked (${c.blocked})`, "text-red-400"]] as const).map(([k, l, cl]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full px-3 py-1 text-[10px] font-medium transition-all border", filter === k ? `${cl} border-current/30 bg-current/10` : "text-zinc-500 border-zinc-800 hover:border-zinc-700")}>{l}</button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map((item, i) => (
          <div key={i} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", item.status === "done" ? "border-zinc-800/50 opacity-50" : "border-zinc-800 hover:border-zinc-700 transition-colors")}>
            <span className="text-sm">{statusEmoji[item.status]}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", priColor[item.priority])}>{item.priority}</span>
            <span className={cn("flex-1 text-xs", item.status === "done" ? "text-zinc-500 line-through" : "text-zinc-300")}>{item.task}</span>
            <span className="text-[9px] text-zinc-600 rounded bg-zinc-800/60 px-1.5 py-0.5">{item.category}</span>
            {item.effort && <span className="text-[9px] text-zinc-600 font-mono">{item.effort}</span>}
          </div>
        ))}
      </div>

      {!dbLoading && dbIssues.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400/70">Live Issues (system_issues table)</h3>
          {dbIssues.map(iss => (
            <div key={iss.id} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", iss.is_resolved ? "border-zinc-800/50 opacity-40" : "border-zinc-800")}>
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", iss.severity === "critical" ? "bg-red-500/15 text-red-400" : iss.severity === "high" ? "bg-orange-500/15 text-orange-400" : iss.severity === "medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-zinc-500/15 text-zinc-400")}>{iss.severity}</span>
              <span className="text-[10px] font-medium text-zinc-500">[{iss.area}]</span>
              <span className={cn("flex-1 text-xs", iss.is_resolved ? "text-zinc-500 line-through" : "text-zinc-300")}>{iss.issue}</span>
              <button onClick={() => toggle(iss.id, iss.is_resolved)} className="p-1 rounded hover:bg-zinc-800 transition-colors"><Check size={12} className={iss.is_resolved ? "text-emerald-400" : "text-zinc-600"} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Main export ═══ */

export default function GodStructure() {
  const { user, loading: aL } = useAuth();
  const { isAdmin, loading: dL } = useAdmin();
  const [tab, setTab] = useState<Tab>("overview");

  const { checks, lastChecked, checking: hC, run: runH } = useSupabaseHealth();
  const { layers: spine, checking: sC, run: runS } = useEmpireSpine();
  const { issues, loading: iL, toggle } = useIssues();

  useEffect(() => { document.title = "God Structure — AI Empire Architecture"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);

  if (aL || dL) return <div className="flex min-h-screen items-center justify-center bg-[#08080c]"><Loader2 size={20} className="animate-spin text-emerald-400" /></div>;
  if (!user || !isAdmin) return <Navigate to="/portal" replace />;

  const onSvc = checks.filter(c => c.status === "online").length;
  const onSp = spine.filter(l => l.status === "online").length;
  const openIss = issues.filter(i => !i.is_resolved).length;
  const done = ROADMAP.filter(i => i.status === "done").length;
  const health = hC || sC ? "checking" : onSvc === checks.length && onSp >= 5 ? "healthy" : onSvc === 0 ? "critical" : "degraded";

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "infrastructure", label: "Infrastructure", icon: Layers },
    { id: "status", label: "Health", icon: Activity },
    { id: "roadmap", label: "Roadmap", icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-300">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10"><Network size={20} className="text-emerald-400" /></div>
            <div><h1 className="text-lg font-bold tracking-tight text-zinc-100 font-mono">God Structure</h1><p className="text-[11px] text-zinc-500">AI Empire Architecture · v2.0</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1", health === "healthy" ? "border-emerald-500/30 bg-emerald-500/10" : health === "critical" ? "border-red-500/30 bg-red-500/10" : health === "degraded" ? "border-amber-500/30 bg-amber-500/10" : "border-zinc-700")}>
              {health === "checking" ? <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" /> : health === "healthy" ? <CheckCircle2 size={12} className="text-emerald-400" /> : health === "critical" ? <XCircle size={12} className="text-red-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
              <span className={cn("text-[11px] font-medium", health === "healthy" ? "text-emerald-400" : health === "critical" ? "text-red-400" : health === "degraded" ? "text-amber-400" : "text-zinc-500")}>{health === "checking" ? "Checking…" : health === "healthy" ? "All Systems Go" : health === "critical" ? "Critical" : "Degraded"}</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 mb-8">
          {tabs.map(t => { const I = t.icon; return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all", tab === t.id ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><I size={14} />{t.label}</button>
          ); })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {tab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Kpi label="Services" value={`${onSvc}/${checks.length}`} sub="Supabase endpoints" cls="text-blue-400" />
                  <Kpi label="Spine" value={`${onSp}/7`} sub="Empire layers" cls="text-emerald-400" />
                  <Kpi label="Open Issues" value={iL ? "…" : String(openIss)} sub="system_issues table" cls={openIss > 0 ? "text-amber-400" : "text-emerald-400"} />
                  <Kpi label="Roadmap" value={`${done}/${ROADMAP.length}`} sub={`${ROADMAP.filter(i => i.status === "todo").length} to do · ${ROADMAP.filter(i => i.status === "blocked").length} blocked`} cls="text-purple-400" />
                </div>
                <Spine layers={spine} checking={sC} onRefresh={runS} />
                <SvcGrid checks={checks} checking={hC} onRefresh={runH} lastChecked={lastChecked} />
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Workflows</p><p className="text-xl font-bold font-mono text-amber-400">{WORKFLOWS.length}</p><p className="text-[10px] text-zinc-600 mt-1">registered in frontend</p></div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Infra Layers</p><p className="text-xl font-bold font-mono text-purple-400">{INFRA_LAYERS.length}</p><p className="text-[10px] text-zinc-600 mt-1">Edge → Backend → Auto → Compute → AI</p></div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Repositories</p><p className="text-xl font-bold font-mono text-blue-400">2</p><p className="text-[10px] text-zinc-600 mt-1">hans-crafted-stories + marketplacegrowth</p></div>
                </div>
              </div>
            )}

            {tab === "infrastructure" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 mb-4">5 layers from CDN to AI. Click to expand.</p>
                {INFRA_LAYERS.map((l, i) => <InfraCard key={l.id} layer={l} idx={i} />)}
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400/70">Tech Stack</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400 md:grid-cols-3">
                    <div><span className="text-zinc-200 font-medium">Frontend:</span> Vite, React 18, TS, shadcn/ui, Framer Motion, Tailwind</div>
                    <div><span className="text-zinc-200 font-medium">Backend:</span> Supabase (Postgres, Auth, Edge Fns), n8n</div>
                    <div><span className="text-zinc-200 font-medium">Deploy:</span> Cloudflare Pages, Vercel (SaaS), GitHub</div>
                    <div><span className="text-zinc-200 font-medium">AI:</span> Claude, Ollama (qwen2.5), AnythingLLM, Qdrant</div>
                    <div><span className="text-zinc-200 font-medium">Infra:</span> 2× Hostinger VPS, Docker, Traefik, Cloudflare DNS</div>
                    <div><span className="text-zinc-200 font-medium">I18n:</span> EN + NL bilingual</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400/70">Workflow Registry ({WORKFLOWS.length})</h3>
                  <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                    {WORKFLOWS.map(w => (
                      <div key={w.name} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                        <div><span className="text-xs font-medium text-zinc-300">{w.label}</span><span className="ml-2 text-[10px] text-zinc-600 font-mono">{w.name}</span></div>
                        <div className="flex items-center gap-2"><span className="text-[9px] text-zinc-600">{w.keywords.length} kw</span><span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", catColor[w.category] || "bg-zinc-500/15 text-zinc-400")}>{w.category}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "status" && (
              <div className="space-y-8">
                <Spine layers={spine} checking={sC} onRefresh={runS} />
                <SvcGrid checks={checks} checking={hC} onRefresh={runH} lastChecked={lastChecked} />
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400/70">Connected Services</h3>
                  <div className="space-y-1">
                    {[
                      { n: "Cloudflare Pages", id: "hansvanleeuwen.com", r: "Frontend hosting" },
                      { n: "Vercel", id: "marketplacegrowth.nl", r: "SaaS frontend" },
                      { n: "GitHub", id: "jowikroon/hans-crafted-stories", r: "Source code" },
                      { n: "Supabase", id: "pesfakewujjwkyybwaom", r: "DB + Auth + Edge Fns" },
                      { n: "VPS1", id: "srv1402218 / 187.124.1.75", r: "n8n + Docker + AI" },
                      { n: "n8n Hostinger", id: "n8n.srv1402218.hstgr.cloud", r: "Workflow automation" },
                      { n: "n8n Cloud", id: "hansvanleeuwen.app.n8n.cloud", r: "Secondary n8n" },
                      { n: "Ollama VPS2", id: "srv1411336:11434", r: "Local AI inference" },
                      { n: "AnythingLLM", id: "VPS1:3001", r: "RAG interface" },
                      { n: "Qdrant", id: "VPS1:6333", r: "Vector database" },
                    ].map(s => (
                      <div key={s.n} className="grid grid-cols-[130px_1fr_170px_50px] items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-xs">
                        <span className="font-medium text-zinc-300">{s.n}</span>
                        <span className="text-zinc-600 font-mono text-[10px] truncate">{s.id}</span>
                        <span className="text-zinc-500">{s.r}</span>
                        <span className="text-right text-emerald-400 text-[10px] font-semibold">● LIVE</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "roadmap" && <RoadmapTab items={ROADMAP} dbIssues={issues} dbLoading={iL} toggle={toggle} />}

          </motion.div>
        </AnimatePresence>

        <div className="mt-16 pb-8 flex items-center justify-between text-[10px] text-zinc-600 border-t border-zinc-800/50 pt-4">
          <span>Hans van Leeuwen · AI Empire</span>
          <span className="font-mono">v2.0 · {new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>
    </div>
  );
}
