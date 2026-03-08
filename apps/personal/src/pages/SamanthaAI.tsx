import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link } from "react-router-dom";
import {
  Send, Mic, MicOff, Loader2, ArrowRight, Volume2, VolumeX,
  ChevronDown, Bot, Cpu, Globe, Brain, Wrench, Zap, Server, Terminal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runIntentPipeline, triggerWorkflow } from "@/lib/intent/pipeline";
import type { WorkflowDef } from "@/lib/config/workflows";
import { cn } from "@/lib/utils";

/* ═══ Types ═══ */

interface Message { id: string; role: "user" | "samantha" | "system"; content: string; timestamp: number; model?: string; }
type Stage = "idle" | "listening" | "thinking" | "routing" | "executing";
type ProviderKind = "cloud" | "local" | "agent";
interface AIModel { id: string; label: string; provider: string; tag: string; kind: ProviderKind; icon: typeof Bot; color: string; description: string; }

/* ═══ All AI systems ═══ */

const AI_MODELS: AIModel[] = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tag: "Fast", kind: "cloud", icon: Zap, color: "text-white/80", description: "Fast, balanced — default" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tag: "Powerful", kind: "cloud", icon: Brain, color: "text-white/80", description: "Stronger reasoning" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tag: "Preview", kind: "cloud", icon: Zap, color: "text-white/70", description: "Latest preview" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tag: "Compact", kind: "cloud", icon: Bot, color: "text-white/80", description: "Fast OpenAI model" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tag: "Smart", kind: "cloud", icon: Bot, color: "text-white/80", description: "Strong all-rounder" },
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Premium", kind: "cloud", icon: Brain, color: "text-white/90", description: "Excellent reasoning" },
  { id: "ollama/qwen2.5:7b", label: "Qwen 2.5 7B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-white/70", description: "7B — fast, no API cost" },
  { id: "ollama/qwen2.5:14b", label: "Qwen 2.5 14B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-white/70", description: "14B — better reasoning" },
  { id: "ollama/llama3.2:1b", label: "Llama 3.2 1B", provider: "Ollama VPS1", tag: "Tiny", kind: "local", icon: Cpu, color: "text-white/60", description: "1B — ultra-fast" },
  { id: "anythingllm", label: "AnythingLLM", provider: "VPS1 RAG", tag: "RAG", kind: "local", icon: Globe, color: "text-white/70", description: "Grounded in your docs" },
  { id: "agent/google", label: "Google Agent", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Wrench, color: "text-white/70", description: "Gmail, Sheets, Drive" },
  { id: "agent/health", label: "Health Check", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Server, color: "text-white/70", description: "Infrastructure status" },
  { id: "agent/seo-audit", label: "SEO Audit", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Globe, color: "text-white/70", description: "On-page SEO analysis" },
];

const MODEL_KEY = "samantha_model";
const HISTORY_KEY = "samantha_conversation";
const VOICE_KEY = "samantha_voice_enabled";

const SAMANTHA_SYSTEM = `You are Samantha — Hans van Leeuwen's AI companion and the primary interface to his entire digital infrastructure.

Personality: warm, perceptive, slightly playful but always competent. Speak naturally — never robotic. Remember context within the conversation.

Infrastructure access:
- n8n workflows (AutoSEO, product feeds, campaigns, health checks, scrapers)
- Supabase (20 tables, auth, edge functions)
- Cloudflare Pages (hansvanleeuwen.com) + Vercel (marketplacegrowth.nl)
- 2 VPS servers (orchestration + AI inference)
- Ollama local models (qwen2.5:7b + 14b), AnythingLLM (RAG), Qdrant (vectors)
- Claude Code CLI on VPS1

When asked to DO something: route to the right system. When they want to TALK: converse naturally.
Be concise. Be warm. Be useful. You're the starting point for everything.`;

/* ═══ Backend callers (unchanged) ═══ */

async function getAuthToken(): Promise<string> { const { data } = await supabase.auth.getSession(); return data?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""; }
const SB_URL = () => import.meta.env.VITE_SUPABASE_URL || "";

async function collectSSE(res: Response): Promise<string> {
  if (!res.headers.get("content-type")?.includes("text/event-stream")) return "";
  const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; for (const line of dec.decode(value, { stream: true }).split("\n")) { if (!line.startsWith("data: ") || line === "data: [DONE]") continue; try { const j = JSON.parse(line.slice(6)); full += j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || ""; } catch {} } }
  return full;
}

async function callCloud(model: string, msgs: { role: string; content: string }[]): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL(); if (!url) return "Backend not configured.";
  try { const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs] }) }); if (!res.ok) return `Error (${res.status}). ${(await res.text().catch(() => "")).slice(0, 120)}`; const sse = await collectSSE(res); if (sse) return sse; const data = await res.json(); return data?.reply || data?.choices?.[0]?.message?.content || data?.response || data?.text || "Empty."; } catch (e: any) { return `Connection failed — ${e?.message}`; }
}

async function callOllama(modelId: string, msgs: { role: string; content: string }[]): Promise<string> {
  const model = modelId.replace("ollama/", ""); const isVps1 = model.includes("llama3.2"); const token = await getAuthToken(); const url = SB_URL(); if (!url) return "Backend not configured.";
  try { const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model: modelId, messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs], provider: "ollama", ollama_host: isVps1 ? "http://172.20.0.1:11434" : "http://187.124.2.66:11434" }) }); if (!res.ok) { try { const host = isVps1 ? "http://187.124.1.75:11434" : "http://187.124.2.66:11434"; const r2 = await fetch(`${host}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs], stream: false }) }); if (r2.ok) { const d = await r2.json(); return d?.message?.content || "Empty."; } } catch {} return `Ollama (${model}) unreachable.`; } const sse = await collectSSE(res); if (sse) return sse; const data = await res.json(); return data?.reply || data?.choices?.[0]?.message?.content || data?.message?.content || "Empty."; } catch (e: any) { return `Ollama error — ${e?.message}`; }
}

async function callAnythingLLM(msgs: { role: string; content: string }[]): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL();
  try { const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model: "anythingllm", messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs], provider: "anythingllm" }) }); if (res.ok) { const sse = await collectSSE(res); if (sse) return sse; const d = await res.json(); return d?.reply || d?.textResponse || d?.text || "Empty."; } try { const r2 = await fetch("http://187.124.1.75:3001/api/v1/workspace/default/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msgs[msgs.length - 1]?.content || "", mode: "chat" }) }); if (r2.ok) { const d = await r2.json(); return d?.textResponse || d?.text || "Empty."; } } catch {} return "AnythingLLM unreachable."; } catch (e: any) { return `Error — ${e?.message}`; }
}

async function callAgent(agentId: string, userMessage: string): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL(); if (!url) return "Backend not configured.";
  const routes: Record<string, string> = { "agent/google": `${url}/functions/v1/google-agent`, "agent/health": `${url}/functions/v1/empire-health`, "agent/seo-audit": `${url}/functions/v1/site-audit` };
  const endpoint = routes[agentId]; if (!endpoint) return `Unknown agent: ${agentId}`;
  try { const body = agentId === "agent/health" ? {} : agentId === "agent/seo-audit" ? { url: userMessage.trim().startsWith("http") ? userMessage.trim() : "https://hansvanleeuwen.com" } : { message: userMessage }; const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }); if (!res.ok) return `Agent returned ${res.status}.`; const data = await res.json(); if (agentId === "agent/health") { const svcs = data.services || {}; const entries = Object.entries(svcs) as [string, any][]; const on = entries.filter(([, v]) => v.ok).length; return `Health: ${on}/${entries.length} online.\n\n${entries.map(([k, v]: [string, any]) => `${v.ok ? "✅" : "❌"} ${k}${v.latency ? ` (${v.latency}ms)` : ""}`).join("\n")}`; } return typeof data === "string" ? data : data?.reply || data?.response || data?.text || JSON.stringify(data).slice(0, 500); } catch (e: any) { return `Agent error — ${e?.message}`; }
}

async function callModel(id: string, msgs: { role: string; content: string }[]): Promise<string> {
  if (id.startsWith("agent/")) return callAgent(id, msgs[msgs.length - 1]?.content || "");
  if (id === "anythingllm") return callAnythingLLM(msgs);
  if (id.startsWith("ollama/")) return callOllama(id, msgs);
  return callCloud(id, msgs);
}

/* ═══ Hooks ═══ */

function uid() { return Math.random().toString(36).slice(2, 10); }

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [on, setOn] = useState(() => { try { return localStorage.getItem(VOICE_KEY) === "true"; } catch { return false; } });
  const speak = useCallback((text: string) => { if (!on || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[*#_`[\]]/g, "").slice(0, 500)); u.rate = 0.95; u.pitch = 1.05; u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false); const v = window.speechSynthesis.getVoices(); const p = v.find(x => /samantha|karen|victoria|zira|female/i.test(x.name)) || v.find(x => x.lang.startsWith("en")) || v[0]; if (p) u.voice = p; window.speechSynthesis.speak(u); }, [on]);
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  const toggle = useCallback(() => { setOn(v => { const n = !v; try { localStorage.setItem(VOICE_KEY, String(n)); } catch {} if (!n) window.speechSynthesis?.cancel(); return n; }); }, []);
  return { speaking, on, speak, stop, toggle };
}

function useVoiceInput(onResult: (t: string) => void) {
  const [listening, setListening] = useState(false); const ref = useRef<any>(null);
  useEffect(() => { const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) return; const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-US"; r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); }; r.onend = () => setListening(false); r.onerror = () => setListening(false); ref.current = r; }, [onResult]);
  const toggle = useCallback(() => { if (!ref.current) return; if (listening) ref.current.stop(); else { ref.current.start(); setListening(true); } }, [listening]);
  return { listening, toggle, ok: typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}

/* ═══ Main ═══ */

export default function SamanthaAI() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [clarification, setClarification] = useState<{ workflows: WorkflowDef[]; original: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem(MODEL_KEY) || AI_MODELS[0].id; } catch { return AI_MODELS[0].id; } });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wavesActive, setWavesActive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { speaking, on: voiceOn, speak, toggle: toggleVoice } = useSpeech();
  const onVoice = useCallback((t: string) => { setInput(t); setTimeout(() => handleSend(t), 100); }, []);
  const { listening, toggle: toggleListen, ok: voiceOk } = useVoiceInput(onVoice);

  const hasMessages = messages.length > 0;

  useEffect(() => { try { localStorage.setItem(MODEL_KEY, selectedModel); } catch {} }, [selectedModel]);
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setMessages(p); } } catch {} }, []);
  useEffect(() => { if (messages.length > 0) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60))); } catch {} }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);
  useEffect(() => { if (!pickerOpen) return; const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [pickerOpen]);
  useEffect(() => { document.title = "Samantha — AI Companion"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);
  useEffect(() => { if (stage !== "idle" || speaking || listening) setWavesActive(true); else { const t = setTimeout(() => setWavesActive(false), 2000); return () => clearTimeout(t); } }, [stage, speaking, listening]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF6B35 100%)" }}><Loader2 size={24} className="animate-spin text-white/80" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

  const cur = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  const append = (msg: Omit<Message, "id" | "timestamp">) => { const m: Message = { ...msg, id: uid(), timestamp: Date.now() }; setMessages(prev => [...prev, m]); return m; };

  const handleSend = async (override?: string) => {
    const text = (override || input).trim(); if (!text || stage !== "idle") return;
    setInput(""); setClarification(null); append({ role: "user", content: text });
    if (cur.kind === "agent") { setStage("executing"); append({ role: "system", content: `Running **${cur.label}**…` }); const reply = await callAgent(cur.id, text); append({ role: "samantha", content: reply, model: cur.label }); speak(reply); setStage("idle"); return; }
    setStage("routing"); const result = await runIntentPipeline(text, "samantha");
    if (result.outcome.type === "workflow_match") { setStage("executing"); const wf = result.outcome.workflow; append({ role: "system", content: `Routing to **${wf.label}**…` }); const res = await triggerWorkflow(wf, "samantha", { message: text }); const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 500)}` : `${wf.label} didn't respond — ${res.error}.`; append({ role: "samantha", content: reply, model: wf.label }); speak(reply); setStage("idle"); return; }
    if (result.outcome.type === "clarify") { setClarification({ workflows: result.outcome.workflows, original: text }); append({ role: "samantha", content: result.outcome.message || "I found a few things that might match. Which one?" }); setStage("idle"); return; }
    setStage("thinking"); const history = messages.slice(-12).map(m => ({ role: m.role === "samantha" ? "assistant" : m.role === "user" ? "user" : "system", content: m.content })); history.push({ role: "user", content: text }); const response = await callModel(selectedModel, history); append({ role: "samantha", content: response, model: cur.label }); speak(response); setStage("idle");
  };

  const handleClarify = async (wf: WorkflowDef) => { setClarification(null); setStage("executing"); append({ role: "system", content: `Running **${wf.label}**…` }); const res = await triggerWorkflow(wf, "samantha", { message: clarification?.original || "" }); const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}` : `${wf.label} had an issue — ${res.error}.`; append({ role: "samantha", content: reply, model: wf.label }); speak(reply); setStage("idle"); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const stageText = stage === "listening" ? "Listening…" : stage === "thinking" ? `Thinking via ${cur.label}…` : stage === "routing" ? "Understanding…" : stage === "executing" ? "Working on it…" : null;

  const groups: { label: string; kind: ProviderKind; items: AIModel[] }[] = [
    { label: "Cloud LLMs", kind: "cloud", items: AI_MODELS.filter(m => m.kind === "cloud") },
    { label: "Local Models", kind: "local", items: AI_MODELS.filter(m => m.kind === "local") },
    { label: "Agents", kind: "agent", items: AI_MODELS.filter(m => m.kind === "agent") },
  ];

  /* ── Model picker dropdown (shared between states) ── */
  const ModelPicker = () => (
    <div className="relative" ref={pickerRef}>
      <button onClick={() => setPickerOpen(!pickerOpen)} className={cn("flex w-full items-center justify-between rounded-full px-4 py-2 text-[11px] transition-all border", pickerOpen ? "bg-white/20 border-white/30" : "bg-white/10 border-white/15 hover:bg-white/15")}>
        <div className="flex items-center gap-2">
          <cur.icon size={12} className="text-white/70" />
          <span className="text-white/80 font-medium">{cur.label}</span>
          <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold text-white/50">{cur.tag}</span>
        </div>
        <ChevronDown size={11} className={cn("text-white/40 transition-transform", pickerOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute left-0 right-0 bottom-full mb-2 z-50 max-h-[50vh] overflow-y-auto rounded-2xl border border-white/15 bg-black/70 backdrop-blur-2xl shadow-2xl">
            {groups.map(g => (
              <div key={g.kind}>
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur px-4 py-2 border-b border-white/10"><p className="text-[9px] font-semibold uppercase tracking-[2px] text-white/40">{g.label}</p></div>
                {g.items.map(model => { const Icon = model.icon; const active = selectedModel === model.id; return (
                  <button key={model.id} onClick={() => { setSelectedModel(model.id); setPickerOpen(false); }} className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all", active ? "bg-white/10" : "hover:bg-white/5")}>
                    <Icon size={13} className="text-white/50" />
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className={cn("text-[11px] font-medium", active ? "text-white" : "text-white/70")}>{model.label}</span><span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold text-white/40">{model.tag}</span></div><p className="text-[9px] text-white/30 truncate">{model.description}</p></div>
                    {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </button>
                ); })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── Input bar (shared between states) ── */
  const InputBar = () => (
    <div className="flex items-end gap-2">
      {voiceOk && (
        <button onClick={toggleListen} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all", listening ? "bg-white text-[#FF6B6B] shadow-lg" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80")} title={listening ? "Stop" : "Voice"}>
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}
      <input
        value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey as any}
        placeholder={listening ? "Listening…" : "Ask Samantha anything…"}
        disabled={stage !== "idle"} autoFocus
        className="flex-1 rounded-full bg-white/95 px-5 py-3 text-[15px] text-gray-800 placeholder:text-gray-400 shadow-lg shadow-black/5 outline-none focus:bg-white focus:-translate-y-[1px] disabled:opacity-40 transition-all"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
      <button onClick={() => handleSend()} disabled={!input.trim() || stage !== "idle"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B6B] text-white shadow-lg transition-all hover:bg-[#FF5252] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100">
        <Send size={15} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF6B35 100%)" }}>

      {/* ════════════════════════════════════════════════════════
          EMPTY STATE — Google-style centered layout
          ════════════════════════════════════════════════════════ */}
      {!hasMessages && (
        <>
          {/* Utility bar — flush under navbar */}
          <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-20">
            <div className="flex items-center justify-between py-2">
              <p className="text-[12px] font-light tracking-[3px] text-white/50 uppercase">Samantha</p>
              <div className="flex items-center gap-2">
                <Link to="/hansai" className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[10px] text-white/40 hover:text-white/70 transition-all"><Terminal size={10} /> Terminal</Link>
                <button onClick={toggleVoice} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-all", voiceOn ? "bg-white/20 text-white" : "bg-white/10 text-white/40 hover:text-white/70")}>{voiceOn ? <Volume2 size={12} /> : <VolumeX size={12} />}</button>
              </div>
            </div>
          </div>

          {/* Centered hero — logo + input like Google */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 -mt-8">
            {/* Logo */}
            <div className="relative mb-10 cursor-pointer" onClick={() => { setWavesActive(true); setTimeout(() => setWavesActive(false), 2500); }}>
              <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500", wavesActive ? "opacity-100" : "opacity-0")}>
                {[80, 120, 160, 200].map((size, i) => (<div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" style={{ width: size, height: size, animation: `samantha-wave 2s ease-out infinite ${i * 0.2}s` }} />))}
              </div>
              <div className="relative w-[80px] h-[40px]">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full border-[3px] border-white" style={{ animation: "samantha-pulse 2.5s ease-in-out infinite" }} />
                <div className="absolute right-0 top-0 w-10 h-10 rounded-full border-[3px] border-white" style={{ animation: "samantha-pulse 2.5s ease-in-out infinite 0.15s" }} />
              </div>
            </div>

            {/* Search bar — the centerpiece */}
            <div className="w-full max-w-xl space-y-3">
              <ModelPicker />
              <InputBar />
            </div>

            {/* Suggestion chips below input */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Check system health", "Optimize my product titles", "What can you do?", "Run AutoSEO"].map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => handleSend(s), 50); }} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white hover:border-white/30">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          CONVERSATION STATE — input centered below header,
          history scrolls above it
          ════════════════════════════════════════════════════════ */}
      {hasMessages && (
        <>
          {/* Utility bar */}
          <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-20">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {/* Mini Samantha dot — stays visible during conversation */}
                <div className="relative">
                  <div className={cn("h-2.5 w-2.5 rounded-full transition-all duration-500", stage !== "idle" ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" : speaking ? "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "bg-white/50")} />
                  {stage !== "idle" && <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />}
                </div>
                <p className="text-[12px] font-light tracking-[3px] text-white/50 uppercase">Samantha</p>
                {stageText && <span className="text-[10px] text-white/40">{stageText}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Link to="/hansai" className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[10px] text-white/40 hover:text-white/70 transition-all"><Terminal size={10} /> Terminal</Link>
                <button onClick={toggleVoice} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-all", voiceOn ? "bg-white/20 text-white" : "bg-white/10 text-white/40 hover:text-white/70")}>{voiceOn ? <Volume2 size={12} /> : <VolumeX size={12} />}</button>
                <button onClick={() => { setMessages([]); localStorage.removeItem(HISTORY_KEY); }} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/40 hover:text-white/70 transition-all">Clear</button>
              </div>
            </div>
          </div>

          {/* Centered input (always visible, Google-style) */}
          <div className="relative z-10 mx-auto w-full max-w-xl px-6 py-3 space-y-2">
            <ModelPicker />
            <InputBar />
          </div>

          {/* Conversation history — scrolls below the input */}
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-6 py-4 space-y-3">
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "samantha" && (
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <div className="h-2 w-2 rounded-full bg-white" style={{ animation: "samantha-pulse 2s ease-in-out infinite" }} />
                    </div>
                  )}
                  {msg.role === "system" && (
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight size={10} className="text-white/50" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user" ? "bg-white/95 text-gray-900 shadow-lg shadow-black/5" :
                      msg.role === "system" ? "bg-white/10 text-white/50 text-xs italic backdrop-blur-sm" :
                      "bg-white/15 text-white/90 backdrop-blur-sm"
                    )} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {msg.content.split("\n").map((line, j) => (<span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>))}
                    </div>
                    {msg.model && msg.role === "samantha" && <p className="mt-1 text-[9px] text-white/30 pl-1">via {msg.model}</p>}
                  </div>
                </motion.div>
              ))}

              {/* Clarification */}
              <AnimatePresence>
                {clarification && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-white/50">Which one?</p>
                    <div className="flex flex-wrap gap-2">
                      {clarification.workflows.map(wf => (<button key={wf.name} onClick={() => handleClarify(wf)} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20">{wf.label}</button>))}
                      <button onClick={() => setClarification(null)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/70">Something else</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Thinking */}
              {stage !== "idle" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"><Loader2 size={11} className="animate-spin text-white/70" /></div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes samantha-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes samantha-wave { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
      `}</style>
    </div>
  );
}
