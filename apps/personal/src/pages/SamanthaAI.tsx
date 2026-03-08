import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import { Send, Mic, MicOff, Loader2, Sparkles, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runIntentPipeline, triggerWorkflow } from "@/lib/intent/pipeline";
import type { WorkflowDef } from "@/lib/config/workflows";

/* ═══ Types ═══ */

interface Message {
  id: string;
  role: "user" | "samantha" | "system";
  content: string;
  timestamp: number;
  emotion?: string;
}

type Stage = "idle" | "listening" | "thinking" | "routing" | "executing" | "speaking";

/* ═══ Config ═══ */

const SAMANTHA_SYSTEM = `You are Samantha — Hans van Leeuwen's AI companion and the primary interface to his entire digital infrastructure.

Your personality: warm, perceptive, slightly playful but always competent. You speak naturally — never robotic. You remember context within the conversation and build on it.

You have access to Hans's infrastructure:
- n8n workflows (AutoSEO, product feeds, campaigns, health checks, scrapers)
- Supabase database (20 tables, auth, edge functions)
- Cloudflare Pages (hansvanleeuwen.com)
- Vercel (marketplacegrowth.nl)
- 2 VPS servers (orchestration + AI inference)
- Ollama local models (qwen2.5:7b + 14b)

When the user asks you to DO something (run a workflow, check health, optimize SEO, etc.), you route through the intent pipeline. When they want to TALK, you converse naturally.

Be concise. Be warm. Be useful. You're the starting point for everything.`;

const HISTORY_KEY = "samantha_conversation";
const VOICE_KEY = "samantha_voice_enabled";

/* ═══ Helpers ═══ */

function uid() { return Math.random().toString(36).slice(2, 10); }

async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) return "I can't reach my backend right now. Supabase URL isn't configured.";

    const res = await fetch(`${url}/functions/v1/n8n-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: SAMANTHA_SYSTEM }, ...messages],
        model: "google/gemini-2.5-flash",
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return `Something went wrong on my end (${res.status}). ${err.slice(0, 100)}`;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || data?.response || data?.text || "I processed that but got an empty response back.";
  } catch (e: any) {
    return `I lost connection — ${e?.message || "unknown error"}. Want me to try again?`;
  }
}

/* ═══ Speech ═══ */

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem(VOICE_KEY) === "true"; } catch { return false; }
  });

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ""));
    utt.rate = 0.95;
    utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    // Try to pick a natural female voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /samantha|karen|victoria|zira|female/i.test(v.name)) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);

  const toggle = useCallback(() => {
    setVoiceEnabled(v => {
      const next = !v;
      try { localStorage.setItem(VOICE_KEY, String(next)); } catch {}
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  return { speaking, voiceEnabled, speak, stop, toggle };
}

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  }, [onResult]);

  const toggleListening = useCallback(() => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); } else { recogRef.current.start(); setListening(true); }
  }, [listening]);

  return { listening, toggleListening, supported: typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}

/* ═══ Main Component ═══ */

export default function SamanthaAI() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [clarification, setClarification] = useState<{ workflows: WorkflowDef[]; original: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { speaking, voiceEnabled, speak, stop, toggle: toggleVoice } = useSpeech();

  const onVoiceResult = useCallback((text: string) => {
    setInput(text);
    // Auto-send after voice
    setTimeout(() => { handleSend(text); }, 100);
  }, []);

  const { listening, toggleListening, supported: voiceSupported } = useVoiceInput(onVoiceResult);

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) setMessages(parsed); }
    } catch {}
  }, []);

  // Save history
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50))); } catch {}
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);

  // SEO
  useEffect(() => {
    document.title = "Samantha — AI Companion";
    const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })();
    m.content = "noindex, nofollow";
    return () => { m.content = "index, follow"; };
  }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#060608]"><Loader2 size={20} className="animate-spin text-rose-400" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

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
    setStage("thinking");

    // 1. Try intent pipeline first
    setStage("routing");
    const result = await runIntentPipeline(text, "samantha");

    if (result.outcome.type === "workflow_match") {
      setStage("executing");
      const wf = result.outcome.workflow;
      append({ role: "system", content: `Routing to **${wf.label}**…` });

      const res = await triggerWorkflow(wf, "samantha", { message: text });
      const reply = res.ok
        ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 500)}`
        : `${wf.label} didn't respond as expected — ${res.error || "timeout"}. Want me to try a different approach?`;

      const sam = append({ role: "samantha", content: reply });
      speak(reply);
      setStage("idle");
      return;
    }

    if (result.outcome.type === "clarify") {
      setClarification({ workflows: result.outcome.workflows, original: text });
      append({ role: "samantha", content: result.outcome.message || "I found a few things that might match. Which one did you mean?" });
      setStage("idle");
      return;
    }

    // 2. Fallback to AI chat
    setStage("thinking");
    const history = messages.slice(-10).map(m => ({
      role: m.role === "samantha" ? "assistant" : m.role === "user" ? "user" : "system",
      content: m.content,
    }));
    history.push({ role: "user", content: text });

    const response = await callLLM(history);
    const sam = append({ role: "samantha", content: response });
    speak(response);
    setStage("idle");
  };

  const handleClarify = async (wf: WorkflowDef) => {
    setClarification(null);
    setStage("executing");
    append({ role: "system", content: `Running **${wf.label}**…` });
    const res = await triggerWorkflow(wf, "samantha", { message: clarification?.original || "" });
    const reply = res.ok
      ? `Done. ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}`
      : `Hmm, ${wf.label} had an issue — ${res.error}. Let me know if you want to try again.`;
    append({ role: "samantha", content: reply });
    speak(reply);
    setStage("idle");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const stageLabel = stage === "listening" ? "Listening…" : stage === "thinking" ? "Thinking…" : stage === "routing" ? "Understanding…" : stage === "executing" ? "Working on it…" : stage === "speaking" ? "Speaking…" : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#060608]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-rose-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-48 w-[400px] rounded-full bg-violet-500/[0.03] blur-[80px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-24 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Samantha dot */}
            <div className="relative">
              <div className={`h-3 w-3 rounded-full transition-all duration-700 ${
                stage !== "idle" ? "bg-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.5)]" :
                speaking ? "bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.5)]" :
                "bg-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]"
              }`} />
              {(stage !== "idle" || speaking) && (
                <div className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" />
              )}
            </div>
            <div>
              <h1 className="text-base font-medium tracking-tight text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>Samantha</h1>
              <p className="text-[10px] text-zinc-500">{stageLabel || "Ready"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleVoice} className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${voiceEnabled ? "border-violet-500/30 text-violet-400 bg-violet-500/10" : "border-zinc-800 text-zinc-600 hover:text-zinc-400"}`} title={voiceEnabled ? "Mute voice" : "Enable voice"}>
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); localStorage.removeItem(HISTORY_KEY); }} className="flex h-7 items-center rounded-full border border-zinc-800 px-2.5 text-[10px] text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all">Clear</button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/15 bg-rose-500/[0.06]">
                <Sparkles size={24} className="text-rose-400" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-zinc-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hello, I'm Samantha</h2>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                Your AI companion and the front door to everything. Ask me to run workflows, check your infrastructure, optimize SEO — or just talk.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "Check system health",
                  "Optimize my product titles",
                  "What's the status of my VPS?",
                  "Run AutoSEO",
                ].map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(() => handleSend(s), 50); }} className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[11px] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 hover:bg-rose-500/[0.04]">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-100 text-zinc-900"
                  : msg.role === "system"
                    ? "border border-zinc-800 bg-zinc-900/50 text-zinc-500 text-xs italic"
                    : "bg-zinc-900/80 border border-zinc-800/60 text-zinc-300"
              }`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Clarification picker */}
          <AnimatePresence>
            {clarification && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-rose-400/70">Which one?</p>
                <div className="flex flex-wrap gap-2">
                  {clarification.workflows.map(wf => (
                    <button key={wf.name} onClick={() => handleClarify(wf)} className="rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-3 py-1.5 text-xs font-medium text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10">
                      {wf.label}
                    </button>
                  ))}
                  <button onClick={() => setClarification(null)} className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-all">
                    Something else
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thinking indicator */}
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

      {/* Input */}
      <div className="relative z-10 border-t border-zinc-800/50 bg-[#060608]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-end gap-3">
            {voiceSupported && (
              <button
                onClick={toggleListening}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                  listening
                    ? "border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse"
                    : "border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30"
                }`}
                title={listening ? "Stop listening" : "Voice input"}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? "Listening…" : "Talk to Samantha…"}
              rows={1}
              disabled={stage !== "idle"}
              className="flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-rose-500/30 focus:outline-none disabled:opacity-40 transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || stage !== "idle"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition-all hover:bg-rose-400 disabled:opacity-20 disabled:hover:bg-rose-500"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
