import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import {
  Send, Mic, MicOff, Loader2, Sparkles, ArrowRight, Volume2, VolumeX,
  ChevronDown, Bot, Cpu, Globe, Brain, Wrench, Zap, Server,
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
  role: "user" | "samantha" | "system";
  content: string;
  timestamp: number;
  model?: string;
}

type Stage = "idle" | "listening" | "thinking" | "routing" | "executing";

/* ═══════════════════════════════════════════════════════════════
   AI SYSTEMS — every model/agent Samantha can talk to
   ═══════════════════════════════════════════════════════════════ */

type ProviderKind = "cloud" | "local" | "agent";

interface AIModel {
  id: string;
  label: string;
  provider: string;
  tag: string;
  kind: ProviderKind;
  icon: typeof Bot;
  color: string;
  description: string;
}

const AI_MODELS: AIModel[] = [
  // ── Cloud LLMs (via hansai-chat edge function / Lovable gateway) ──
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tag: "Fast", kind: "cloud", icon: Zap, color: "text-blue-400", description: "Fast, balanced — default for most tasks" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tag: "Powerful", kind: "cloud", icon: Brain, color: "text-blue-400", description: "Stronger reasoning, longer context" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tag: "Preview", kind: "cloud", icon: Zap, color: "text-cyan-400", description: "Latest preview — experimental" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tag: "Compact", kind: "cloud", icon: Bot, color: "text-emerald-400", description: "Fast OpenAI model, good for quick tasks" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tag: "Smart", kind: "cloud", icon: Bot, color: "text-emerald-400", description: "Full GPT-4o — strong all-rounder" },
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Premium", kind: "cloud", icon: Brain, color: "text-violet-400", description: "Claude Sonnet — excellent reasoning" },

  // ── Local LLMs (Ollama on VPS) ──
  { id: "ollama/qwen2.5:7b", label: "Qwen 2.5 7B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-amber-400", description: "7B params — fast local inference, no API cost" },
  { id: "ollama/qwen2.5:14b", label: "Qwen 2.5 14B", provider: "Ollama VPS2", tag: "Local", kind: "local", icon: Cpu, color: "text-amber-400", description: "14B params — better reasoning, slower" },
  { id: "ollama/llama3.2:1b", label: "Llama 3.2 1B", provider: "Ollama VPS1", tag: "Tiny", kind: "local", icon: Cpu, color: "text-orange-400", description: "1B params — ultra-fast classification" },

  // ── RAG / Specialized ──
  { id: "anythingllm", label: "AnythingLLM", provider: "VPS1 RAG", tag: "RAG", kind: "local", icon: Globe, color: "text-pink-400", description: "RAG over your documents — grounded answers" },

  // ── Agents (edge functions with tool use) ──
  { id: "agent/google", label: "Google Agent", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Wrench, color: "text-teal-400", description: "Gmail, Sheets, Drive — reads and writes" },
  { id: "agent/health", label: "Health Check", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Server, color: "text-green-400", description: "Check all infrastructure services" },
  { id: "agent/seo-audit", label: "SEO Audit", provider: "Edge Function", tag: "Agent", kind: "agent", icon: Globe, color: "text-yellow-400", description: "Full on-page SEO analysis" },
];

const MODEL_STORAGE_KEY = "samantha_model";
const HISTORY_KEY = "samantha_conversation";
const VOICE_KEY = "samantha_voice_enabled";

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — adapts per model
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   BACKEND CALLERS — one per provider type
   ═══════════════════════════════════════════════════════════════ */

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
}

const SUPABASE_URL = () => import.meta.env.VITE_SUPABASE_URL || "";

/** Cloud LLMs — route through hansai-chat edge function (supports Gemini direct + Lovable gateway) */
async function callCloud(model: string, msgs: { role: string; content: string }[]): Promise<string> {
  const token = await getAuthToken();
  const url = SUPABASE_URL();
  if (!url) return "Backend not configured (no SUPABASE_URL).";

  try {
    const res = await fetch(`${url}/functions/v1/hansai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs],
      }),
    });

    if (!res.ok) return `Cloud model error (${res.status}). ${(await res.text().catch(() => "")).slice(0, 120)}`;

    // hansai-chat streams SSE — collect full response
    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const j = JSON.parse(line.slice(6));
            const delta = j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || "";
            full += delta;
          } catch {}
        }
      }
      return full || "Empty response from model.";
    }

    const data = await res.json();
    return data?.reply || data?.choices?.[0]?.message?.content || data?.response || data?.text || "Empty response.";
  } catch (e: any) {
    return `Connection failed — ${e?.message || "unknown"}`;
  }
}

/** Ollama — direct HTTP to VPS (OpenAI-compatible /v1/chat/completions or /api/chat) */
async function callOllama(modelId: string, msgs: { role: string; content: string }[]): Promise<string> {
  // Route based on model tag — VPS1 for llama3.2:1b, VPS2 for qwen2.5 models
  const model = modelId.replace("ollama/", "");
  const isVps1 = model.includes("llama3.2");

  // Ollama on VPS isn't directly reachable from browser (internal IPs).
  // Route through the Claude Relay webhook on n8n which can SSH/proxy to Ollama.
  const token = await getAuthToken();
  const url = SUPABASE_URL();
  if (!url) return "Backend not configured.";

  try {
    // Use n8n-agent as a proxy — it can be configured to call Ollama
    // Or call hansai-chat which will route to the gateway
    const res = await fetch(`${url}/functions/v1/hansai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs],
        provider: "ollama",
        ollama_host: isVps1 ? "http://172.20.0.1:11434" : "http://187.124.2.66:11434",
      }),
    });

    if (!res.ok) {
      // Fallback: try calling Ollama directly (works if user is on VPN or same network)
      try {
        const host = isVps1 ? "http://187.124.1.75:11434" : "http://187.124.2.66:11434";
        const ollamaRes = await fetch(`${host}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs],
            stream: false,
          }),
        });
        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          return data?.message?.content || "Ollama responded but with empty content.";
        }
      } catch {}
      return `Ollama (${model}) isn't reachable right now. The VPS may be down or Ollama isn't running.`;
    }

    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try { const j = JSON.parse(line.slice(6)); full += j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || ""; } catch {}
        }
      }
      return full || "Empty response from Ollama.";
    }

    const data = await res.json();
    return data?.reply || data?.choices?.[0]?.message?.content || data?.message?.content || "Empty.";
  } catch (e: any) {
    return `Ollama error — ${e?.message}`;
  }
}

/** AnythingLLM — VPS1 port 3001 */
async function callAnythingLLM(msgs: { role: string; content: string }[]): Promise<string> {
  // AnythingLLM isn't publicly exposed — route through n8n-agent or direct if on network
  const token = await getAuthToken();
  const url = SUPABASE_URL();

  try {
    // Try via edge function proxy
    const res = await fetch(`${url}/functions/v1/hansai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: "anythingllm",
        messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...msgs],
        provider: "anythingllm",
      }),
    });

    if (res.ok) {
      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); for (const line of chunk.split("\n")) { if (!line.startsWith("data: ") || line === "data: [DONE]") continue; try { const j = JSON.parse(line.slice(6)); full += j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || ""; } catch {} } }
        return full || "Empty.";
      }
      const data = await res.json();
      return data?.reply || data?.textResponse || data?.text || "AnythingLLM responded but with empty content.";
    }

    // Direct fallback
    try {
      const directRes = await fetch("http://187.124.1.75:3001/api/v1/workspace/default/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgs[msgs.length - 1]?.content || "", mode: "chat" }),
      });
      if (directRes.ok) {
        const d = await directRes.json();
        return d?.textResponse || d?.text || "Empty.";
      }
    } catch {}

    return "AnythingLLM isn't reachable. It may not be running on VPS1.";
  } catch (e: any) {
    return `AnythingLLM error — ${e?.message}`;
  }
}

/** Agents — edge functions with specific capabilities */
async function callAgent(agentId: string, userMessage: string): Promise<string> {
  const token = await getAuthToken();
  const url = SUPABASE_URL();
  if (!url) return "Backend not configured.";

  const routes: Record<string, string> = {
    "agent/google": `${url}/functions/v1/google-agent`,
    "agent/health": `${url}/functions/v1/empire-health`,
    "agent/seo-audit": `${url}/functions/v1/site-audit`,
  };

  const endpoint = routes[agentId];
  if (!endpoint) return `Unknown agent: ${agentId}`;

  try {
    const body = agentId === "agent/health"
      ? {}
      : agentId === "agent/seo-audit"
        ? { url: userMessage.trim().startsWith("http") ? userMessage.trim() : "https://hansvanleeuwen.com" }
        : { message: userMessage };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) return `Agent returned ${res.status}. ${(await res.text().catch(() => "")).slice(0, 200)}`;

    const data = await res.json();

    if (agentId === "agent/health") {
      const svcs = data.services || {};
      const entries = Object.entries(svcs) as [string, any][];
      const online = entries.filter(([, v]) => v.ok).length;
      return `Health check complete: ${online}/${entries.length} services online.\n\n${entries.map(([k, v]: [string, any]) => `${v.ok ? "✅" : "❌"} ${k}${v.latency ? ` (${v.latency}ms)` : ""}`).join("\n")}`;
    }

    return typeof data === "string" ? data : data?.reply || data?.response || data?.text || JSON.stringify(data).slice(0, 500);
  } catch (e: any) {
    return `Agent error — ${e?.message}`;
  }
}

/** Master router — picks the right caller based on model ID */
async function callModel(modelId: string, msgs: { role: string; content: string }[]): Promise<string> {
  if (modelId.startsWith("agent/")) return callAgent(modelId, msgs[msgs.length - 1]?.content || "");
  if (modelId === "anythingllm") return callAnythingLLM(msgs);
  if (modelId.startsWith("ollama/")) return callOllama(modelId, msgs);
  return callCloud(modelId, msgs);
}

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

function uid() { return Math.random().toString(36).slice(2, 10); }

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => { try { return localStorage.getItem(VOICE_KEY) === "true"; } catch { return false; } });

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/[*#_`[\]]/g, "").slice(0, 500));
    utt.rate = 0.95; utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /samantha|karen|victoria|zira|female/i.test(v.name)) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  const toggle = useCallback(() => { setVoiceEnabled(v => { const n = !v; try { localStorage.setItem(VOICE_KEY, String(n)); } catch {} if (!n) window.speechSynthesis?.cancel(); return n; }); }, []);
  return { speaking, voiceEnabled, speak, stop, toggle };
}

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    recogRef.current = r;
  }, [onResult]);
  const toggleListening = useCallback(() => { if (!recogRef.current) return; if (listening) recogRef.current.stop(); else { recogRef.current.start(); setListening(true); } }, [listening]);
  return { listening, toggleListening, supported: typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function SamanthaAI() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [clarification, setClarification] = useState<{ workflows: WorkflowDef[]; original: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem(MODEL_STORAGE_KEY) || AI_MODELS[0].id; } catch { return AI_MODELS[0].id; } });
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { speaking, voiceEnabled, speak, toggle: toggleVoice } = useSpeech();
  const onVoiceResult = useCallback((text: string) => { setInput(text); setTimeout(() => handleSend(text), 100); }, []);
  const { listening, toggleListening, supported: voiceSupported } = useVoiceInput(onVoiceResult);

  // Persist model selection
  useEffect(() => { try { localStorage.setItem(MODEL_STORAGE_KEY, selectedModel); } catch {} }, [selectedModel]);

  // Load/save history
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setMessages(p); } } catch {} }, []);
  useEffect(() => { if (messages.length > 0) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60))); } catch {} }, [messages]);

  // Scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);

  // Close picker on outside click
  useEffect(() => {
    if (!modelPickerOpen) return;
    const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setModelPickerOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [modelPickerOpen]);

  // SEO
  useEffect(() => { document.title = "Samantha — AI Companion"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#060608]"><Loader2 size={20} className="animate-spin text-rose-400" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  const append = (msg: Omit<Message, "id" | "timestamp">) => {
    const m: Message = { ...msg, id: uid(), timestamp: Date.now() };
    setMessages(prev => [...prev, m]);
    return m;
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || stage !== "idle") return;
    setInput("");
    setClarification(null);
    append({ role: "user", content: text });

    // For agents, skip intent pipeline — go direct
    if (currentModel.kind === "agent") {
      setStage("executing");
      append({ role: "system", content: `Running **${currentModel.label}**…` });
      const reply = await callAgent(currentModel.id, text);
      append({ role: "samantha", content: reply, model: currentModel.label });
      speak(reply);
      setStage("idle");
      return;
    }

    // 1. Try intent pipeline (only for cloud/local models)
    setStage("routing");
    const result = await runIntentPipeline(text, "samantha");

    if (result.outcome.type === "workflow_match") {
      setStage("executing");
      const wf = result.outcome.workflow;
      append({ role: "system", content: `Routing to **${wf.label}**…` });
      const res = await triggerWorkflow(wf, "samantha", { message: text });
      const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 500)}` : `${wf.label} didn't respond — ${res.error}. Want me to try differently?`;
      append({ role: "samantha", content: reply, model: wf.label });
      speak(reply);
      setStage("idle");
      return;
    }

    if (result.outcome.type === "clarify") {
      setClarification({ workflows: result.outcome.workflows, original: text });
      append({ role: "samantha", content: result.outcome.message || "I found a few things that might match. Which one?" });
      setStage("idle");
      return;
    }

    // 2. Fallback to selected AI model
    setStage("thinking");
    const history = messages.slice(-12).map(m => ({
      role: m.role === "samantha" ? "assistant" : m.role === "user" ? "user" : "system",
      content: m.content,
    }));
    history.push({ role: "user", content: text });

    const response = await callModel(selectedModel, history);
    append({ role: "samantha", content: response, model: currentModel.label });
    speak(response);
    setStage("idle");
  };

  const handleClarify = async (wf: WorkflowDef) => {
    setClarification(null);
    setStage("executing");
    append({ role: "system", content: `Running **${wf.label}**…` });
    const res = await triggerWorkflow(wf, "samantha", { message: clarification?.original || "" });
    const reply = res.ok ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}` : `${wf.label} had an issue — ${res.error}.`;
    append({ role: "samantha", content: reply, model: wf.label });
    speak(reply);
    setStage("idle");
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const stageLabel = stage === "listening" ? "Listening…" : stage === "thinking" ? `Thinking via ${currentModel.label}…` : stage === "routing" ? "Understanding…" : stage === "executing" ? "Working on it…" : null;

  // Group models by kind
  const groups: { label: string; kind: ProviderKind; models: AIModel[] }[] = [
    { label: "Cloud LLMs", kind: "cloud", models: AI_MODELS.filter(m => m.kind === "cloud") },
    { label: "Local Models (Ollama)", kind: "local", models: AI_MODELS.filter(m => m.kind === "local") },
    { label: "Agents", kind: "agent", models: AI_MODELS.filter(m => m.kind === "agent") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#060608]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-rose-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-48 w-[400px] rounded-full bg-violet-500/[0.03] blur-[80px]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-24 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn("h-3 w-3 rounded-full transition-all duration-700",
                stage !== "idle" ? "bg-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.5)]" :
                speaking ? "bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.5)]" :
                "bg-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]"
              )} />
              {(stage !== "idle" || speaking) && <div className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" />}
            </div>
            <div>
              <h1 className="text-base font-medium tracking-tight text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>Samantha</h1>
              <p className="text-[10px] text-zinc-500">{stageLabel || "Ready"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleVoice} className={cn("flex h-7 w-7 items-center justify-center rounded-full border transition-all", voiceEnabled ? "border-violet-500/30 text-violet-400 bg-violet-500/10" : "border-zinc-800 text-zinc-600 hover:text-zinc-400")} title={voiceEnabled ? "Mute" : "Voice"}>
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); localStorage.removeItem(HISTORY_KEY); }} className="flex h-7 items-center rounded-full border border-zinc-800 px-2.5 text-[10px] text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all">Clear</button>
            )}
          </div>
        </motion.div>

        {/* ── Model selector ── */}
        <div className="mt-3 relative" ref={pickerRef}>
          <button onClick={() => setModelPickerOpen(!modelPickerOpen)} className={cn(
            "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all",
            modelPickerOpen ? "border-rose-500/30 bg-rose-500/[0.04]" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
          )}>
            <div className="flex items-center gap-2">
              <currentModel.icon size={13} className={currentModel.color} />
              <span className="text-zinc-300 font-medium">{currentModel.label}</span>
              <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                currentModel.kind === "cloud" ? "border-blue-500/20 text-blue-400/70" :
                currentModel.kind === "local" ? "border-amber-500/20 text-amber-400/70" :
                "border-teal-500/20 text-teal-400/70"
              )}>{currentModel.tag}</span>
              <span className="text-zinc-600 text-[10px]">{currentModel.provider}</span>
            </div>
            <ChevronDown size={12} className={cn("text-zinc-500 transition-transform", modelPickerOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {modelPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-[60vh] overflow-y-auto rounded-xl border border-zinc-800 bg-[#0c0c10] shadow-2xl"
              >
                {groups.map(group => (
                  <div key={group.kind}>
                    <div className="sticky top-0 z-10 bg-[#0c0c10] px-3 py-2 border-b border-zinc-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">{group.label}</p>
                    </div>
                    {group.models.map(model => {
                      const Icon = model.icon;
                      const active = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => { setSelectedModel(model.id); setModelPickerOpen(false); }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all",
                            active ? "bg-rose-500/[0.06]" : "hover:bg-zinc-900/80"
                          )}
                        >
                          <Icon size={14} className={model.color} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-medium", active ? "text-rose-300" : "text-zinc-300")}>{model.label}</span>
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-[8px] font-bold",
                                model.kind === "cloud" ? "border-blue-500/20 text-blue-400/60" :
                                model.kind === "local" ? "border-amber-500/20 text-amber-400/60" :
                                "border-teal-500/20 text-teal-400/60"
                              )}>{model.tag}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 truncate">{model.description}</p>
                          </div>
                          {active && <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/15 bg-rose-500/[0.06]">
                <Sparkles size={24} className="text-rose-400" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-zinc-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hello, I'm Samantha</h2>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500">Your AI companion. I can talk to {AI_MODELS.length} models, run workflows, check infrastructure — or just chat. Pick a model above and ask me anything.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {["Check system health", "Optimize my product titles", "What can you do?", "Run AutoSEO"].map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(() => handleSend(s), 50); }} className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[11px] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 hover:bg-rose-500/[0.04]">{s}</button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "samantha" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                  <div className="h-2 w-2 rounded-full bg-rose-400" />
                </div>
              )}
              {msg.role === "system" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                  <ArrowRight size={10} className="text-zinc-500" />
                </div>
              )}
              <div className="max-w-[80%]">
                <div className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user" ? "bg-zinc-100 text-zinc-900" :
                  msg.role === "system" ? "border border-zinc-800 bg-zinc-900/50 text-zinc-500 text-xs italic" :
                  "bg-zinc-900/80 border border-zinc-800/60 text-zinc-300"
                )} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {msg.content.split("\n").map((line, j) => (<span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>))}
                </div>
                {msg.model && msg.role === "samantha" && (
                  <p className="mt-1 text-[9px] text-zinc-600 pl-1">via {msg.model}</p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Clarification */}
          <AnimatePresence>
            {clarification && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-rose-400/70">Which one?</p>
                <div className="flex flex-wrap gap-2">
                  {clarification.workflows.map(wf => (
                    <button key={wf.name} onClick={() => handleClarify(wf)} className="rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-3 py-1.5 text-xs font-medium text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10">{wf.label}</button>
                  ))}
                  <button onClick={() => setClarification(null)} className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Something else</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thinking */}
          {stage !== "idle" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                <Loader2 size={10} className="animate-spin text-rose-400" />
              </div>
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="relative z-10 border-t border-zinc-800/50 bg-[#060608]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-end gap-3">
            {voiceSupported && (
              <button onClick={toggleListening} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all", listening ? "border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse" : "border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30")} title={listening ? "Stop" : "Voice"}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <textarea
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={listening ? "Listening…" : `Talk to Samantha via ${currentModel.label}…`}
              rows={1} disabled={stage !== "idle"}
              className="flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-rose-500/30 focus:outline-none disabled:opacity-40 transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || stage !== "idle"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition-all hover:bg-rose-400 disabled:opacity-20">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
