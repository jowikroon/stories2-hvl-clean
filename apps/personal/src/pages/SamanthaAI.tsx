import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link } from "react-router-dom";
import {
  Send, Mic, MicOff, Loader2, ArrowRight, Volume2, VolumeX,
  ChevronDown, Bot, Cpu, Globe, Brain, Wrench, Zap, Server, Terminal,
  CheckCircle2, XCircle, AlertTriangle, Copy, Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runIntentPipeline, triggerWorkflow } from "@/lib/intent/pipeline";
import type { WorkflowDef } from "@/lib/config/workflows";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Message {
  id: string;
  role: "user" | "samantha" | "system" | "tool";
  content: string;
  timestamp: number;
  model?: string;
  toolStatus?: "running" | "success" | "error";
  toolName?: string;
  streaming?: boolean;
}

type Stage = "idle" | "listening" | "thinking" | "routing" | "executing";
type Emotion = "calm" | "thinking" | "working" | "speaking" | "error" | "success";
type ProviderKind = "cloud" | "local" | "agent";

interface AIModel {
  id: string; label: string; provider: string; tag: string; kind: ProviderKind;
  icon: typeof Bot; color: string; description: string;
  suggestions: string[];
}

/* ═══════════════════════════════════════════════════════════════
   AI MODELS — with per-model suggestions (3.3)
   ═══════════════════════════════════════════════════════════════ */

const AI_MODELS: AIModel[] = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tag: "Fast", kind: "cloud", icon: Zap, color: "text-white/80", description: "Fast, balanced — default",
    suggestions: ["Summarize this for me", "Help me write an email", "Explain how SEO works", "Generate product descriptions"] },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tag: "Powerful", kind: "cloud", icon: Brain, color: "text-white/80", description: "Stronger reasoning",
    suggestions: ["Analyze my business strategy", "Compare Amazon vs Bol.com approach", "Design a content pipeline", "Review my architecture"] },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tag: "Preview", kind: "cloud", icon: Zap, color: "text-white/70", description: "Latest preview",
    suggestions: ["Test the latest model", "How are you different from 2.5?", "Solve a complex problem", "Analyze this data"] },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tag: "Compact", kind: "cloud", icon: Bot, color: "text-white/80", description: "Fast OpenAI model",
    suggestions: ["Quick translation to Dutch", "Format this as JSON", "Fix this code snippet", "Write a short ad copy"] },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tag: "Smart", kind: "cloud", icon: Bot, color: "text-white/80", description: "Strong all-rounder",
    suggestions: ["Debug this workflow logic", "Write a technical spec", "Analyze competitor strategy", "Create a marketing plan"] },
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Premium", kind: "cloud", icon: Brain, color: "text-white/90", description: "Excellent reasoning",
    suggestions: ["Review my code architecture", "Write documentation", "Analyze a complex problem", "Help me think through this"] },
  { id: "ollama/qwen2.5:7b", label: "Qwen 2.5 7B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-white/70", description: "7B — fast, no API cost",
    suggestions: ["Quick classification task", "Summarize this text", "What models are loaded?", "Test local inference speed"] },
  { id: "ollama/qwen2.5:14b", label: "Qwen 2.5 14B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-white/70", description: "14B — better reasoning",
    suggestions: ["Reason through this problem", "Generate a detailed analysis", "Compare two approaches", "Write a complex prompt"] },
  { id: "ollama/llama3.2:1b", label: "Llama 3.2 1B", provider: "Ollama VPS1", tag: "Tiny", kind: "local", icon: Cpu, color: "text-white/60", description: "1B — ultra-fast",
    suggestions: ["Classify this text", "Extract keywords", "Simple yes/no question", "Quick sentiment check"] },
  { id: "anythingllm", label: "AnythingLLM", provider: "VPS1 RAG", tag: "RAG", kind: "local", icon: Globe, color: "text-white/70", description: "Grounded in your docs",
    suggestions: ["Search my documents", "What do my docs say about X?", "Find relevant information", "Answer from my knowledge base"] },
  { id: "agent/google", label: "Google Agent", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Wrench, color: "text-white/70", description: "Gmail, Sheets, Drive",
    suggestions: ["Summarize my latest emails", "What's in my inbox?", "Add a row to my sheet", "List my Drive files"] },
  { id: "agent/health", label: "Health Check", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Server, color: "text-white/70", description: "Infrastructure status",
    suggestions: ["Check all services", "Is everything online?", "System status report", "Any issues?"] },
  { id: "agent/seo-audit", label: "SEO Audit", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Globe, color: "text-white/70", description: "On-page SEO analysis",
    suggestions: ["Audit hansvanleeuwen.com", "Check my SEO score", "Find SEO issues", "Audit https://example.com"] },
];

const MODEL_KEY = "samantha_model";
const HISTORY_KEY = "samantha_conversation";
const VOICE_KEY = "samantha_voice_enabled";

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — with health context injection (2.2)
   ═══════════════════════════════════════════════════════════════ */

function buildSystemPrompt(healthContext?: string): string {
  return `You are Samantha — Hans van Leeuwen's AI companion and the primary interface to his entire digital infrastructure.

Personality: warm, perceptive, slightly playful but always competent. Speak naturally — never robotic. Remember context within the conversation. Use markdown for formatting when helpful (bold, code blocks, lists).

Infrastructure access:
- n8n workflows (AutoSEO, product feeds, campaigns, health checks, scrapers)
- Supabase (20 tables, auth, edge functions)
- Cloudflare Pages (hansvanleeuwen.com) + Vercel (marketplacegrowth.nl)
- 2 VPS servers (orchestration + AI inference)
- Ollama local models (qwen2.5:7b + 14b), AnythingLLM (RAG), Qdrant (vectors)
- Claude Code CLI on VPS1

When asked to DO something: route to the right system. When they want to TALK: converse naturally.
Be concise. Be warm. Be useful. You're the starting point for everything.${healthContext ? `\n\nCurrent infrastructure status:\n${healthContext}` : ""}`;
}

/* ═══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER (3.2)
   ═══════════════════════════════════════════════════════════════ */

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const parts = useMemo(() => {
    const segments: { type: "text" | "code"; content: string; lang?: string }[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
      segments.push({ type: "code", content: match[2], lang: match[1] || undefined });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) segments.push({ type: "text", content: content.slice(lastIndex) });
    return segments;
  }, [content]);

  const renderInline = (text: string) => {
    return text.split(/(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{linkMatch[1]}</a>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={cn("text-sm leading-relaxed", className)} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {parts.map((part, i) => {
        if (part.type === "code") {
          return (
            <div key={i} className="my-2 rounded-xl bg-black/30 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono">{part.lang || "code"}</span>
                <button onClick={() => { navigator.clipboard.writeText(part.content); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }} className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
                  {copiedIdx === i ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-white/70">{part.content}</pre>
            </div>
          );
        }
        return (
          <div key={i}>
            {part.content.split("\n").map((line, j) => {
              if (line.startsWith("- ") || line.startsWith("* ")) return <div key={j} className="flex gap-2 py-0.5"><span className="text-white/40 shrink-0">•</span><span>{renderInline(line.slice(2))}</span></div>;
              if (/^\d+\.\s/.test(line)) return <div key={j} className="flex gap-2 py-0.5"><span className="text-white/40 shrink-0 font-mono text-xs">{line.match(/^\d+/)?.[0]}.</span><span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span></div>;
              if (!line.trim()) return <div key={j} className="h-2" />;
              return <div key={j} className="py-0.5">{renderInline(line)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOOL STATUS CARD (2.5)
   ═══════════════════════════════════════════════════════════════ */

function ToolStatusCard({ name, status }: { name: string; status: "running" | "success" | "error" }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs backdrop-blur-sm border",
      status === "running" ? "bg-white/10 border-white/15" :
      status === "success" ? "bg-emerald-500/10 border-emerald-500/20" :
      "bg-red-500/10 border-red-500/20"
    )}>
      {status === "running" ? <Loader2 size={13} className="animate-spin text-white/60" /> :
       status === "success" ? <CheckCircle2 size={13} className="text-emerald-400" /> :
       <XCircle size={13} className="text-red-400" />}
      <span className="font-medium text-white/80">{name}</span>
      <span className={cn("ml-auto text-[10px]",
        status === "running" ? "text-white/40" : status === "success" ? "text-emerald-400/70" : "text-red-400/70"
      )}>{status === "running" ? "Running…" : status === "success" ? "Complete" : "Failed"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BACKEND CALLERS — with streaming support (1.4, 3.1)
   ═══════════════════════════════════════════════════════════════ */

async function getAuthToken(): Promise<string> { const { data } = await supabase.auth.getSession(); return data?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""; }
const SB_URL = () => import.meta.env.VITE_SUPABASE_URL || "";

type StreamCallback = (chunk: string) => void;

async function streamSSE(res: Response, onChunk: StreamCallback): Promise<string> {
  if (!res.headers.get("content-type")?.includes("text/event-stream")) return "";
  const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const j = JSON.parse(line.slice(6));
        const delta = j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || "";
        if (delta) { full += delta; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

async function callCloud(model: string, msgs: { role: string; content: string }[], systemPrompt: string, onChunk?: StreamCallback): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL();
  if (!url) throw new Error("Backend not configured — set VITE_SUPABASE_URL in Cloudflare Pages.");
  const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...msgs] }) });
  if (!res.ok) { const err = await res.text().catch(() => ""); throw new Error(res.status === 401 ? "Auth failed — try signing out and back in." : res.status === 429 ? "Rate limited — wait a moment and try again." : res.status >= 500 ? `Server error (${res.status}). The AI backend may be temporarily down.` : `Error ${res.status}: ${err.slice(0, 120)}`); }
  if (onChunk) { const sse = await streamSSE(res, onChunk); if (sse) return sse; }
  const data = await res.json();
  return data?.reply || data?.choices?.[0]?.message?.content || data?.response || data?.text || "Empty response.";
}

async function callOllama(modelId: string, msgs: { role: string; content: string }[], systemPrompt: string, onChunk?: StreamCallback): Promise<string> {
  const model = modelId.replace("ollama/", ""); const isVps1 = model.includes("llama3.2");
  const token = await getAuthToken(); const url = SB_URL();
  if (!url) throw new Error("Backend not configured.");
  try {
    const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model: modelId, messages: [{ role: "system", content: systemPrompt }, ...msgs], provider: "ollama", ollama_host: isVps1 ? "http://172.20.0.1:11434" : "http://187.124.2.66:11434" }) });
    if (!res.ok) {
      try { const host = isVps1 ? "http://187.124.1.75:11434" : "http://187.124.2.66:11434"; const r2 = await fetch(`${host}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...msgs], stream: false }) }); if (r2.ok) { const d = await r2.json(); return d?.message?.content || "Empty."; } } catch {}
      throw new Error(`Ollama (${model}) is unreachable. Check if the VPS is running.`);
    }
    if (onChunk) { const sse = await streamSSE(res, onChunk); if (sse) return sse; }
    const data = await res.json(); return data?.reply || data?.choices?.[0]?.message?.content || data?.message?.content || "Empty.";
  } catch (e: any) { throw new Error(`Ollama: ${e?.message}`); }
}

async function callAnythingLLM(msgs: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL();
  try {
    const res = await fetch(`${url}/functions/v1/hansai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model: "anythingllm", messages: [{ role: "system", content: systemPrompt }, ...msgs], provider: "anythingllm" }) });
    if (res.ok) { const d = await res.json(); return d?.reply || d?.textResponse || d?.text || "Empty."; }
    try { const r2 = await fetch("http://187.124.1.75:3001/api/v1/workspace/default/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msgs[msgs.length - 1]?.content || "", mode: "chat" }) }); if (r2.ok) { const d = await r2.json(); return d?.textResponse || d?.text || "Empty."; } } catch {}
    throw new Error("AnythingLLM is unreachable. Check if the container is running on VPS1.");
  } catch (e: any) { throw new Error(`AnythingLLM: ${e?.message}`); }
}

async function callAgent(agentId: string, userMessage: string): Promise<string> {
  const token = await getAuthToken(); const url = SB_URL(); if (!url) throw new Error("Backend not configured.");
  const routes: Record<string, string> = { "agent/google": `${url}/functions/v1/google-agent`, "agent/health": `${url}/functions/v1/empire-health`, "agent/seo-audit": `${url}/functions/v1/site-audit` };
  const endpoint = routes[agentId]; if (!endpoint) throw new Error(`Unknown agent: ${agentId}`);
  const body = agentId === "agent/health" ? {} : agentId === "agent/seo-audit" ? { url: userMessage.trim().startsWith("http") ? userMessage.trim() : "https://hansvanleeuwen.com" } : { message: userMessage };
  const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Agent returned ${res.status}. ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  if (agentId === "agent/health") { const svcs = data.services || {}; const entries = Object.entries(svcs) as [string, any][]; const on = entries.filter(([, v]) => v.ok).length; return `**Health check complete:** ${on}/${entries.length} services online.\n\n${entries.map(([k, v]: [string, any]) => `${v.ok ? "✅" : "❌"} **${k}**${v.latency ? ` (${v.latency}ms)` : ""}`).join("\n")}`; }
  return typeof data === "string" ? data : data?.reply || data?.response || data?.text || JSON.stringify(data).slice(0, 500);
}

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

function uid() { return Math.random().toString(36).slice(2, 10); }

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [on, setOn] = useState(() => { try { return localStorage.getItem(VOICE_KEY) === "true"; } catch { return false; } });
  const speak = useCallback((text: string) => { if (!on || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[*#_`[\]]/g, "").slice(0, 500)); u.rate = 0.95; u.pitch = 1.05; u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false); const v = window.speechSynthesis.getVoices(); const p = v.find(x => /samantha|karen|victoria|zira|female/i.test(x.name)) || v.find(x => x.lang.startsWith("en")) || v[0]; if (p) u.voice = p; window.speechSynthesis.speak(u); }, [on]);
  const toggle = useCallback(() => { setOn(v => { const n = !v; try { localStorage.setItem(VOICE_KEY, String(n)); } catch {} if (!n) window.speechSynthesis?.cancel(); return n; }); }, []);
  return { speaking, on, speak, toggle };
}

function useVoiceInput(onResult: (t: string) => void) {
  const [listening, setListening] = useState(false); const ref = useRef<any>(null);
  useEffect(() => { const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) return; const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-US"; r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); }; r.onend = () => setListening(false); r.onerror = () => setListening(false); ref.current = r; }, [onResult]);
  const toggle = useCallback(() => { if (!ref.current) return; if (listening) ref.current.stop(); else { ref.current.start(); setListening(true); } }, [listening]);
  return { listening, toggle, ok: typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}

// Health context injection (2.2)
function useHealthContext() {
  const [context, setContext] = useState<string>("");
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken(); const url = SB_URL(); if (!url) return;
        const res = await fetch(`${url}/functions/v1/empire-health`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data.services) {
          const entries = Object.entries(data.services) as [string, any][];
          const on = entries.filter(([, v]) => v.ok).length;
          setContext(`${on}/${entries.length} services online. ${entries.filter(([, v]) => !v.ok).map(([k]) => `${k} is DOWN`).join(", ") || "All healthy."}`);
        }
      } catch {}
    })();
  }, []);
  return context;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function SamanthaAI() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [emotion, setEmotion] = useState<Emotion>("calm");
  const [clarification, setClarification] = useState<{ workflows: WorkflowDef[]; original: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem(MODEL_KEY) || AI_MODELS[0].id; } catch { return AI_MODELS[0].id; } });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wavesActive, setWavesActive] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { speaking, on: voiceOn, speak, toggle: toggleVoice } = useSpeech();
  const onVoice = useCallback((t: string) => { setInput(t); setTimeout(() => handleSend(t), 100); }, []);
  const { listening, toggle: toggleListen, ok: voiceOk } = useVoiceInput(onVoice);
  const healthContext = useHealthContext();

  const hasMessages = messages.length > 0;
  const cur = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  const systemPrompt = useMemo(() => buildSystemPrompt(healthContext), [healthContext]);

  // Persistence
  useEffect(() => { try { localStorage.setItem(MODEL_KEY, selectedModel); } catch {} }, [selectedModel]);
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setMessages(p.map((m: any) => ({ ...m, streaming: false }))); } } catch {} }, []);
  useEffect(() => { if (messages.length > 0) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.filter(m => !m.streaming).slice(-60))); } catch {} }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);
  useEffect(() => { if (!pickerOpen) return; const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [pickerOpen]);
  useEffect(() => { document.title = "Samantha — AI Companion"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);

  // Emotional state indicator (5.4)
  useEffect(() => {
    if (stage === "thinking") setEmotion("thinking");
    else if (stage === "executing" || stage === "routing") setEmotion("working");
    else if (speaking) setEmotion("speaking");
    else setEmotion("calm");
  }, [stage, speaking]);

  useEffect(() => { setWavesActive(emotion !== "calm"); }, [emotion]);

  // Keyboard shortcuts (3.4)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPickerOpen(v => !v); }
      if (e.key === "Escape") { if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; setStage("idle"); setEmotion("calm"); } setPickerOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF6B35 100%)" }}><Loader2 size={24} className="animate-spin text-white/80" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

  const append = (msg: Omit<Message, "id" | "timestamp">) => { const m: Message = { ...msg, id: uid(), timestamp: Date.now() }; setMessages(prev => [...prev, m]); return m; };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleSend = async (override?: string) => {
    const text = (override || input).trim(); if (!text || stage !== "idle") return;
    setInput(""); setClarification(null); append({ role: "user", content: text });

    // Agents — direct call with tool status card (2.5)
    if (cur.kind === "agent") {
      setStage("executing"); setEmotion("working");
      const toolMsg = append({ role: "tool", content: "", toolName: cur.label, toolStatus: "running" });
      try {
        const reply = await callAgent(cur.id, text);
        updateMessage(toolMsg.id, { toolStatus: "success" });
        append({ role: "samantha", content: reply, model: cur.label }); speak(reply);
        setEmotion("success"); setTimeout(() => setEmotion("calm"), 2000);
      } catch (e: any) {
        updateMessage(toolMsg.id, { toolStatus: "error" });
        append({ role: "samantha", content: `Something went wrong: ${e?.message || "Unknown error"}. Want me to try again?`, model: cur.label });
        setEmotion("error"); setTimeout(() => setEmotion("calm"), 3000);
      }
      setStage("idle"); return;
    }

    // Intent pipeline
    setStage("routing"); setEmotion("thinking");
    const result = await runIntentPipeline(text, "samantha");

    if (result.outcome.type === "workflow_match") {
      setStage("executing"); setEmotion("working");
      const wf = result.outcome.workflow;
      const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
      try {
        const res = await triggerWorkflow(wf, "samantha", { message: text });
        const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 500)}` : `${wf.label} didn't respond — ${res.error}.`;
        updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error" });
        append({ role: "samantha", content: reply, model: wf.label }); speak(reply);
        setEmotion(res.ok ? "success" : "error"); setTimeout(() => setEmotion("calm"), 2000);
      } catch (e: any) {
        updateMessage(toolMsg.id, { toolStatus: "error" });
        append({ role: "samantha", content: `Workflow failed: ${e?.message}` }); setEmotion("error");
      }
      setStage("idle"); return;
    }

    if (result.outcome.type === "clarify") {
      setClarification({ workflows: result.outcome.workflows, original: text });
      append({ role: "samantha", content: result.outcome.message || "I found a few things that might match. Which one?" });
      setStage("idle"); setEmotion("calm"); return;
    }

    // Chat fallback — with streaming (3.1)
    setStage("thinking"); setEmotion("thinking");
    const history = messages.filter(m => !m.streaming && m.role !== "tool").slice(-12).map(m => ({ role: m.role === "samantha" ? "assistant" : m.role === "user" ? "user" : "system", content: m.content }));
    history.push({ role: "user", content: text });

    // Create a streaming message placeholder
    const streamMsg = append({ role: "samantha", content: "", model: cur.label, streaming: true });
    setStreamingId(streamMsg.id);

    try {
      const onChunk = (full: string) => { updateMessage(streamMsg.id, { content: full }); };
      let finalContent: string;

      if (cur.id.startsWith("ollama/")) {
        finalContent = await callOllama(cur.id, history, systemPrompt, onChunk);
      } else if (cur.id === "anythingllm") {
        finalContent = await callAnythingLLM(history, systemPrompt);
        updateMessage(streamMsg.id, { content: finalContent });
      } else {
        finalContent = await callCloud(cur.id, history, systemPrompt, onChunk);
      }

      updateMessage(streamMsg.id, { content: finalContent, streaming: false });
      speak(finalContent);
      setEmotion("success"); setTimeout(() => setEmotion("calm"), 2000);
    } catch (e: any) {
      updateMessage(streamMsg.id, { content: `⚠️ ${e?.message || "Unknown error"}`, streaming: false });
      setEmotion("error"); setTimeout(() => setEmotion("calm"), 3000);
    }

    setStreamingId(null); setStage("idle");
  };

  const handleClarify = async (wf: WorkflowDef) => {
    setClarification(null); setStage("executing"); setEmotion("working");
    const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
    try {
      const res = await triggerWorkflow(wf, "samantha", { message: clarification?.original || "" });
      updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error" });
      const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}` : `${wf.label} had an issue — ${res.error}.`;
      append({ role: "samantha", content: reply, model: wf.label }); speak(reply);
    } catch (e: any) {
      updateMessage(toolMsg.id, { toolStatus: "error" });
      append({ role: "samantha", content: `Failed: ${e?.message}` });
    }
    setStage("idle"); setEmotion("calm");
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const stageText = stage === "listening" ? "Listening…" : stage === "thinking" ? `Thinking via ${cur.label}…` : stage === "routing" ? "Understanding…" : stage === "executing" ? "Working on it…" : null;

  // Emotional colors (5.4)
  const emotionColor = emotion === "calm" ? "bg-white/50" : emotion === "thinking" ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" : emotion === "working" ? "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.5)]" : emotion === "speaking" ? "bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.5)]" : emotion === "error" ? "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.5)]" : "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.5)]";
  const emotionPulseSpeed = emotion === "calm" ? "2.5s" : emotion === "thinking" ? "1.2s" : emotion === "working" ? "0.8s" : "2s";

  const groups: { label: string; kind: ProviderKind; items: AIModel[] }[] = [
    { label: "Cloud LLMs", kind: "cloud", items: AI_MODELS.filter(m => m.kind === "cloud") },
    { label: "Local Models", kind: "local", items: AI_MODELS.filter(m => m.kind === "local") },
    { label: "Agents", kind: "agent", items: AI_MODELS.filter(m => m.kind === "agent") },
  ];

  /* Shared components */
  const ModelPicker = () => (
    <div className="relative" ref={pickerRef}>
      <button onClick={() => setPickerOpen(!pickerOpen)} className={cn("flex w-full items-center justify-between rounded-full px-4 py-2 text-[11px] transition-all border", pickerOpen ? "bg-white/20 border-white/30" : "bg-white/10 border-white/15 hover:bg-white/15")}>
        <div className="flex items-center gap-2"><cur.icon size={12} className="text-white/70" /><span className="text-white/80 font-medium">{cur.label}</span><span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold text-white/50">{cur.tag}</span><span className="hidden sm:inline text-[9px] text-white/30">⌘M</span></div>
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

  const InputBar = () => (
    <div className="flex items-end gap-2">
      {voiceOk && (
        <button onClick={toggleListen} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all", listening ? "bg-white text-[#FF6B6B] shadow-lg" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80")} title="Voice (mic)">
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey as any} placeholder={listening ? "Listening…" : "Ask Samantha anything…"} disabled={stage !== "idle"} autoFocus className="flex-1 min-w-0 rounded-full bg-white/95 px-5 py-3 text-[15px] text-gray-800 placeholder:text-gray-400 shadow-lg shadow-black/5 outline-none focus:bg-white focus:-translate-y-[1px] disabled:opacity-40 transition-all" style={{ fontFamily: "'DM Sans', sans-serif" }} />
      <button onClick={() => handleSend()} disabled={!input.trim() || stage !== "idle"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B6B] text-white shadow-lg transition-all hover:bg-[#FF5252] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100">
        <Send size={15} />
      </button>
    </div>
  );

  // Samantha dot — animated by emotion (3.6 + 5.4)
  const SamanthaDot = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
    <div className="relative">
      <div className={cn("rounded-full transition-all duration-500", emotionColor, size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5")} style={{ animation: `samantha-pulse ${emotionPulseSpeed} ease-in-out infinite` }} />
      {emotion !== "calm" && <div className={cn("absolute inset-0 animate-ping rounded-full", emotion === "error" ? "bg-red-400/30" : emotion === "working" ? "bg-amber-300/30" : "bg-white/30")} />}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF6B35 100%)" }}>

      {/* ── EMPTY STATE ── */}
      {!hasMessages && (
        <>
          <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-20">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2"><SamanthaDot size="lg" /><p className="text-[12px] font-light tracking-[3px] text-white/50 uppercase">Samantha</p></div>
              <div className="flex items-center gap-2">
                <Link to="/hansai" className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[10px] text-white/40 hover:text-white/70 transition-all"><Terminal size={10} /> Terminal</Link>
                <button onClick={toggleVoice} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-all", voiceOn ? "bg-white/20 text-white" : "bg-white/10 text-white/40 hover:text-white/70")}>{voiceOn ? <Volume2 size={12} /> : <VolumeX size={12} />}</button>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 -mt-8">
            <div className="relative mb-10 cursor-pointer" onClick={() => { setWavesActive(true); setTimeout(() => setWavesActive(false), 2500); }}>
              <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500", wavesActive ? "opacity-100" : "opacity-0")}>
                {[80, 120, 160, 200].map((s, i) => (<div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" style={{ width: s, height: s, animation: `samantha-wave 2s ease-out infinite ${i * 0.2}s` }} />))}
              </div>
              <div className="relative w-[80px] h-[40px]">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full border-[3px] border-white" style={{ animation: "samantha-pulse 2.5s ease-in-out infinite" }} />
                <div className="absolute right-0 top-0 w-10 h-10 rounded-full border-[3px] border-white" style={{ animation: "samantha-pulse 2.5s ease-in-out infinite 0.15s" }} />
              </div>
            </div>
            <div className="w-full max-w-xl space-y-3"><ModelPicker /><InputBar /></div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {cur.suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => handleSend(s), 50); }} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white hover:border-white/30">{s}</button>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-white/25">⌘/ focus · ⌘M model · Esc cancel</p>
          </motion.div>
        </>
      )}

      {/* ── CONVERSATION STATE ── */}
      {hasMessages && (
        <>
          <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-20">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <SamanthaDot size="lg" />
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

          <div className="relative z-10 mx-auto w-full max-w-xl px-6 py-3 space-y-2"><ModelPicker /><InputBar /></div>

          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-6 py-4 space-y-3">
              {messages.map(msg => {
                // Tool status cards (2.5)
                if (msg.role === "tool" && msg.toolName && msg.toolStatus) {
                  return <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><ToolStatusCard name={msg.toolName} status={msg.toolStatus} /></motion.div>;
                }

                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "samantha" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                        <SamanthaDot />
                      </div>
                    )}
                    {msg.role === "system" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <ArrowRight size={10} className="text-white/50" />
                      </div>
                    )}
                    <div className={cn("max-w-[85%]", msg.role === "user" && "max-w-[75%]")}>
                      {msg.role === "user" ? (
                        <div className="rounded-2xl bg-white/95 text-gray-900 shadow-lg shadow-black/5 px-4 py-2.5 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{msg.content}</div>
                      ) : msg.role === "system" ? (
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-2.5 text-white/50 text-xs italic" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          <MarkdownContent content={msg.content} className="text-white/50 text-xs" />
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-2.5">
                          <MarkdownContent content={msg.content} className="text-white/90" />
                          {msg.streaming && <span className="inline-block w-1.5 h-4 bg-white/60 ml-0.5 animate-pulse" />}
                        </div>
                      )}
                      {msg.model && msg.role === "samantha" && !msg.streaming && <p className="mt-1 text-[9px] text-white/25 pl-1">via {msg.model}</p>}
                    </div>
                  </motion.div>
                );
              })}

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

              {stage !== "idle" && !streamingId && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"><Loader2 size={11} className="animate-spin text-white/70" /></div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-2.5"><div className="flex gap-1.5"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "0ms" }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "150ms" }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "300ms" }} /></div></div>
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
