import { useState } from "react";

const STATUS = { done: "✅", doing: "🔧", todo: "📋", blocked: "⛔" };

const palette = {
  bg: "#0a0a0f",
  card: "#12121a",
  cardHover: "#1a1a26",
  border: "#1e1e2e",
  accent: "#22c55e",
  accentDim: "#22c55e33",
  warn: "#f59e0b",
  warnDim: "#f59e0b22",
  error: "#ef4444",
  errorDim: "#ef444422",
  blue: "#3b82f6",
  blueDim: "#3b82f622",
  purple: "#a855f7",
  purpleDim: "#a855f722",
  text: "#e2e8f0",
  textDim: "#64748b",
  textMuted: "#475569",
};

// ── DATA ──────────────────────────────────────────
const layers = [
  {
    id: "edge",
    label: "Edge / CDN",
    tech: "Vercel",
    color: palette.accent,
    items: [
      "React 18 + Vite SPA",
      "marketplacegrowth.nl (HTTPS)",
      "Auto-deploy on push to main",
      "Vercel Web Analytics",
    ],
    status: "live",
  },
  {
    id: "backend",
    label: "Backend",
    tech: "Supabase",
    color: palette.blue,
    items: [
      "PostgreSQL — 22 tables, 7 migrations",
      "Auth — 2 admin users, email + OAuth",
      "7 Edge Functions (Content Builder pipeline)",
      "14 validation rules seeded (Amazon DE/FR)",
    ],
    status: "live",
  },
  {
    id: "automation",
    label: "Automation",
    tech: "n8n on VPS",
    color: palette.purple,
    items: [
      "Claude Relay v2 (webhook gateway)",
      "4 monitoring workflows (Docker, endpoints, snapshots, changes)",
      "Site Update Engine v3 (BJ Fogg + LLM)",
      "22 total workflows (7 active)",
    ],
    status: "live",
  },
  {
    id: "compute",
    label: "Compute",
    tech: "Hostinger VPS",
    color: palette.warn,
    items: [
      "Ubuntu 24.04 · 2 cores · 8GB RAM",
      "Docker: n8n, Ollama, Qdrant, AnythingLLM, ttyd",
      "/opt/n8n-monitoring/ (Python scripts)",
      "Traefik reverse proxy",
    ],
    status: "live",
  },
  {
    id: "ai",
    label: "AI Models",
    tech: "Multi-provider",
    color: "#ec4899",
    items: [
      "Gemini API (via Edge Functions, key set)",
      "Ollama local (qwen2.5:7b)",
      "Claude API (via relay + direct)",
      "AnythingLLM (RAG interface)",
    ],
    status: "live",
  },
];

const connections = [
  { from: "edge", to: "backend", label: "Supabase JS Client", type: "data" },
  { from: "backend", to: "ai", label: "Edge Fn → Gemini/Claude", type: "ai" },
  { from: "automation", to: "compute", label: "SSH + Docker API", type: "infra" },
  { from: "automation", to: "backend", label: "Webhook → Supabase", type: "data" },
  { from: "edge", to: "automation", label: "n8n triggers", type: "event" },
];

const progressItems = [
  // Done
  { task: "Domain live (marketplacegrowth.nl)", status: "done", category: "infra" },
  { task: "Vercel deployment pipeline", status: "done", category: "infra" },
  { task: "Git author fix (hansvl3@gmail.com)", status: "done", category: "infra" },
  { task: "Supabase schema — 7 migrations applied", status: "done", category: "backend" },
  { task: "6 Content Builder Edge Functions deployed", status: "done", category: "backend" },
  { task: "GEMINI_API_KEY set in Edge Function secrets", status: "done", category: "backend" },
  { task: "2 admin users created + email confirmed", status: "done", category: "auth" },
  { task: "Lovable auth dependency removed", status: "done", category: "auth" },
  { task: "14 Amazon validation rules seeded (DE/FR)", status: "done", category: "backend" },
  { task: "4 VPS monitoring workflows active", status: "done", category: "infra" },
  { task: "TypeScript types regenerated", status: "done", category: "frontend" },
  { task: "SPA routing + cache headers configured", status: "done", category: "infra" },
  { task: "Vercel Web Analytics installed", status: "done", category: "infra" },
  { task: "Supabase redirect URLs configured", status: "done", category: "auth" },
  { task: "OG meta tags cleaned (removed Lovable refs)", status: "done", category: "frontend" },
  // Doing
  { task: "Wire frontend to new Supabase backend", status: "doing", category: "frontend" },
  { task: "Content Builder wizard → Edge Functions", status: "doing", category: "frontend" },
  // Todo — P0
  { task: "Enable RLS on 6 legacy infra tables", status: "todo", category: "security", priority: "P0" },
  { task: "Enable leaked password protection", status: "todo", category: "security", priority: "P0" },
  // Todo — P1
  { task: "Fix RLS auth.uid() → (select auth.uid()) — 28 policies", status: "todo", category: "perf", priority: "P1" },
  { task: "Add missing FK indexes (6 tables)", status: "todo", category: "perf", priority: "P1" },
  { task: "Replace Lovable OAuth → Supabase Google OAuth", status: "todo", category: "auth", priority: "P1" },
  // Todo — P2
  { task: "Add admin role column to profiles", status: "todo", category: "backend", priority: "P2" },
  { task: "Merge duplicate workspace SELECT policies", status: "todo", category: "perf", priority: "P2" },
  { task: "Route-level code splitting (React.lazy)", status: "todo", category: "frontend", priority: "P2" },
  { task: "GitHub Actions CI (typecheck + build)", status: "todo", category: "infra", priority: "P2" },
  // Todo — P3
  { task: "Move infra tables to separate schema", status: "todo", category: "backend", priority: "P3" },
  { task: "Connect monitoring → Supabase (not files)", status: "todo", category: "infra", priority: "P3" },
  { task: "Clean up 15 inactive n8n workflows", status: "todo", category: "infra", priority: "P3" },
  { task: "Edge Function error monitoring", status: "todo", category: "backend", priority: "P3" },
  { task: "Create OG image (1200×630)", status: "todo", category: "frontend", priority: "P3" },
  { task: "Build out marketing stub pages", status: "todo", category: "frontend", priority: "P3" },
  { task: "Publishing channels (Bol, Amazon, Shopify)", status: "todo", category: "feature", priority: "P3" },
  { task: "Insights dashboard with Recharts", status: "todo", category: "feature", priority: "P3" },
  { task: "Bulk mode (1000+ SKUs)", status: "todo", category: "feature", priority: "P3" },
  { task: "API keys + webhooks system", status: "todo", category: "feature", priority: "P3" },
];

const roadmap = [
  {
    phase: "Phase 1 — Foundation",
    timeline: "Now → Week 1",
    color: palette.error,
    items: [
      "Fix 6 RLS security holes",
      "Enable password protection",
      "Commit + push all Cursor work",
      "Wire frontend pages to Supabase",
      "Test Content Builder end-to-end",
    ],
  },
  {
    phase: "Phase 2 — Core Product",
    timeline: "Week 2–3",
    color: palette.warn,
    items: [
      "Content Builder fully functional (generate → validate → export)",
      "Workspace + brand management working",
      "Replace Lovable OAuth with native Google",
      "Fix all 28 RLS performance policies",
      "Add GitHub Actions CI pipeline",
    ],
  },
  {
    phase: "Phase 3 — Polish & Scale",
    timeline: "Week 4–6",
    color: palette.blue,
    items: [
      "Route-level code splitting",
      "Marketing pages (pricing, about, docs, contact)",
      "Insights dashboard with real data",
      "Connect monitoring to Supabase dashboard",
      "Multi-country support (NL/FR/ES/IT)",
    ],
  },
  {
    phase: "Phase 4 — Growth",
    timeline: "Month 2–3",
    color: palette.accent,
    items: [
      "Publishing channels (Bol.com, Amazon SP-API)",
      "Bulk mode for enterprise (1000+ SKUs)",
      "API keys + webhooks for integrators",
      "Billing + usage tracking (Stripe)",
      "First paying customers",
    ],
  },
];

const serviceMap = [
  { name: "Vercel", id: "prj_jpiL4a...", role: "Frontend hosting", status: "live" },
  { name: "GitHub", id: "jowikroon/marketplacegrowth", role: "Source code", status: "live" },
  { name: "Supabase", id: "pesfake...", role: "DB + Auth + Edge Fns", status: "live" },
  { name: "Hostinger VPS", id: "srv1402218", role: "n8n + Docker + AI", status: "live" },
  { name: "Hostinger n8n", id: "n8n.srv1402218.hstgr.cloud", role: "Workflow automation", status: "live" },
  { name: "Hostinger DNS", id: "marketplacegrowth.nl", role: "Domain registrar", status: "live" },
  { name: "Gemini API", id: "via Edge Functions", role: "AI content generation", status: "live" },
  { name: "Ollama", id: "172.20.0.1:11434", role: "Local AI (qwen2.5:7b)", status: "live" },
  { name: "Qdrant", id: "172.20.0.1:6333", role: "Vector database", status: "live" },
  { name: "AnythingLLM", id: "172.20.0.1:3001", role: "RAG interface", status: "live" },
];

const agents = [
  {
    name: "Claude (Opus 4.6)",
    type: "Orchestrator",
    color: palette.accent,
    status: "active",
    location: "claude.ai / API",
    trigger: "User conversation",
    role: "Primary AI brain. Manages infrastructure, writes code, deploys to Vercel/Supabase/n8n, audits security, creates workflows. The conductor of the entire empire.",
    capabilities: [
      "Full MCP access to Supabase, Vercel, n8n, GitHub, Gmail, Calendar, Linear, Slack",
      "Can create/read/update/delete workflows via Claude Relay webhook",
      "Deploys Edge Functions, runs SQL migrations, manages DNS",
      "Writes and pushes code to GitHub (triggers Vercel deploy)",
      "Audits security (RLS, advisors) and performance",
    ],
    limitations: [
      "Cannot SSH directly to VPS (uses n8n relay instead)",
      "Cannot set Supabase Edge Function secrets (dashboard only)",
      "Cannot create Vercel projects (MCP is read/deploy only)",
      "DNS lookups blocked from container environment",
      "Session-based — no persistent memory between conversations (uses memory system)",
    ],
  },
  {
    name: "Claude Relay v2",
    type: "Gateway Agent",
    color: palette.purple,
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "POST webhook/claude-relay-v2",
    role: "Webhook gateway that gives any external AI (Claude, Cursor, scripts) full programmatic control over the n8n instance. Routes actions to internal n8n API.",
    capabilities: [
      "Create, update, delete, activate workflows",
      "Execute workflows on demand",
      "Get credentials and variables",
      "Smart verification — confirms actions actually succeeded",
      "Dutch error messages (translateError) for debugging",
    ],
    limitations: [
      "Activate action can be buggy — direct API POST is more reliable",
      "No file upload support",
      "Single-tenant — one API key, no auth per caller",
      "Webhook timeout ~30s for complex operations",
    ],
  },
  {
    name: "Content Builder Pipeline",
    type: "AI Content Agent",
    color: palette.blue,
    status: "active",
    location: "Supabase Edge Functions (6)",
    trigger: "Frontend API calls (JWT auth)",
    role: "End-to-end marketplace listing generator. Takes raw product data and produces publish-ready Amazon content with quality scoring and validation.",
    capabilities: [
      "generate-content — LLM-powered listing generation (Gemini primary, Lovable fallback)",
      "content-builder-normalize — EAN/specs normalization and cleanup",
      "content-builder-generate — batch generation for multiple SKUs",
      "content-builder-validate — quality score (0-100) + policy rule checking (14 rules)",
      "content-builder-repair — auto-fix validation errors with AI",
      "content-builder-export — Amazon flatfile CSV + JSON export",
    ],
    limitations: [
      "Gemini API only (no Claude fallback yet — would need ANTHROPIC_API_KEY)",
      "Amazon DE/FR rules only (NL/ES/IT not yet seeded)",
      "No streaming — full response must complete before timeout",
      "Edge Function 60s timeout on free tier",
      "No error monitoring — failures are silent",
    ],
  },
  {
    name: "Site Update Engine v3",
    type: "Deploy Agent",
    color: "#ec4899",
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "POST webhook",
    role: "AI-powered site update orchestrator. Uses BJ Fogg's Behavior Model to classify incoming changes, routes to appropriate builder (content, UI, or feature), and produces deployment-ready output.",
    capabilities: [
      "BJ Fogg classifier — scores motivation/ability/prompt for changes",
      "Fetches last 5 GitHub commits for context",
      "Routes to: Claude Content Builder, Lovable UI Builder, or Feature/Bug Builder",
      "Approval gate — blocks low-confidence changes",
    ],
    limitations: [
      "Does not auto-deploy — produces output for human review",
      "Lovable UI Builder is a code stub (not connected to Lovable API)",
      "Single-repo only (marketplacegrowth)",
      "No rollback capability",
    ],
  },
  {
    name: "Docker Health Scanner",
    type: "Monitor Agent",
    color: palette.warn,
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "Schedule: every 5 min",
    role: "Monitors all Docker containers on the VPS. SSHs to host, runs docker ps, parses health status, and logs alerts for unhealthy containers.",
    capabilities: [
      "Detects container crashes, restarts, unhealthy states",
      "Parses docker ps JSON output",
      "Conditional alerting (healthy vs unhealthy path)",
    ],
    limitations: [
      "Logs to n8n execution history only — no external alerting (no Slack/email)",
      "SSH-based — if SSH credential rotates, workflow breaks",
      "No auto-remediation (doesn't restart containers)",
    ],
  },
  {
    name: "Endpoint Health Checker",
    type: "Monitor Agent",
    color: palette.warn,
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "Schedule: every 5 min",
    role: "Pings all internal service endpoints (AnythingLLM, Ollama, Qdrant, secondary n8n, ttyd) via HTTP and logs up/down status.",
    capabilities: [
      "HTTP health checks on 5 endpoints via 172.20.0.1",
      "continueOnFail — doesn't break if an endpoint is down",
      "Conditional alerting path",
    ],
    limitations: [
      "Internal IPs only — can't check external services (Vercel, Supabase)",
      "No response time tracking",
      "No historical trend data",
    ],
  },
  {
    name: "State Snapshot Logger",
    type: "Monitor Agent",
    color: palette.warn,
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "Schedule: every 15 min",
    role: "Takes comprehensive infrastructure snapshots (docker ps, disk usage, memory) and saves to host filesystem as JSON files.",
    capabilities: [
      "Runs Python snapshot script via SSH",
      "Captures: containers, disk, memory in single JSON",
      "Auto-rotates — keeps max 50 snapshots",
    ],
    limitations: [
      "Writes to host files (/opt/n8n-monitoring/snapshots/) — not queryable from web",
      "No Supabase integration — data stays on VPS",
      "Python script must exist on host",
    ],
  },
  {
    name: "Change Detector",
    type: "Monitor Agent",
    color: palette.warn,
    status: "active",
    location: "n8n (Hostinger VPS)",
    trigger: "Schedule: every 15 min",
    role: "Compares the last two snapshots to detect infrastructure changes. Classifies changes as info/warning/critical based on thresholds.",
    capabilities: [
      "Detects: container state changes, added/removed containers",
      "Detects: disk usage ≥5% change, memory >500MB change",
      "Severity classification (info/warning/critical)",
      "Appends to changes.log (JSONL format)",
    ],
    limitations: [
      "Requires at least 2 snapshots to compare",
      "File-based logging — not in database",
      "No push notifications on critical changes",
    ],
  },
  {
    name: "AutoSEO Brain",
    type: "SEO Agent",
    color: "#06b6d4",
    status: "active",
    location: "n8n (Cloud — hansvanleeuwen.app.n8n.cloud)",
    trigger: "Webhook + Manual",
    role: "Automotive parts SEO generator for connectcarparts.nl. Takes SKU data and generates optimized titles, meta descriptions, and structured data.",
    capabilities: [
      "Processes SKU batches via webhook",
      "Generates SEO titles + meta + schema markup",
      "Issue detection and quality flagging",
      "Responds with structured JSON results",
    ],
    limitations: [
      "connectcarparts.nl specific — not generalized",
      "No LLM integration (rule-based SEO engine)",
      "Runs on cloud n8n, not VPS",
    ],
  },
  {
    name: "Ollama (qwen2.5:7b)",
    type: "Local LLM",
    color: "#f97316",
    status: "active",
    location: "VPS Docker (port 11434)",
    trigger: "HTTP API",
    role: "Local AI model for tasks that don't need cloud APIs. Used by n8n workflows for classification, summarization, and low-latency inference.",
    capabilities: [
      "7B parameter model — fast inference on 2-core VPS",
      "No API costs — unlimited local inference",
      "OpenAI-compatible API",
      "Used by Empire Brain Agent for planning",
    ],
    limitations: [
      "7B model — limited reasoning compared to Claude/GPT-4",
      "No GPU — CPU inference only (slow for long outputs)",
      "2-core VPS bottleneck under concurrent requests",
      "No fine-tuning — base model only",
    ],
  },
  {
    name: "Qdrant + AnythingLLM",
    type: "RAG Agent",
    color: "#8b5cf6",
    status: "idle",
    location: "VPS Docker (ports 6333 + 3001)",
    trigger: "HTTP API / Web UI",
    role: "Vector database (Qdrant) paired with RAG interface (AnythingLLM). Intended for document-grounded Q&A over product catalogs, docs, and internal knowledge.",
    capabilities: [
      "Vector similarity search (Qdrant)",
      "Document ingestion and chunking (AnythingLLM)",
      "Web UI for manual queries",
      "Embedding storage for empire_vector_memory table",
    ],
    limitations: [
      "Currently idle — no documents ingested",
      "empire_vector_memory table has 0 rows",
      "Not connected to Content Builder pipeline yet",
      "Requires manual document upload",
    ],
  },
  {
    name: "Sovereign Empire Brain",
    type: "Supervisor Agent",
    color: palette.textDim,
    status: "inactive",
    location: "n8n (Hostinger VPS)",
    trigger: "Webhook + Chat",
    role: "Designed as the apex supervisor — a Plan-and-Execute agent that coordinates all other agents. Uses Ollama as LLM backbone.",
    capabilities: [
      "Plan-and-Execute agent pattern",
      "Dual trigger (webhook + chat)",
      "Designed to orchestrate all infrastructure actions",
    ],
    limitations: [
      "Currently INACTIVE — not deployed to production",
      "Uses Ollama 7B which limits complex reasoning",
      "No tools connected — can't actually control infrastructure",
      "Superseded by Claude as the real orchestrator",
    ],
  },
];

// ── COMPONENTS ──────────────────────────────────────

function Badge({ children, color = palette.accent }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.5,
        background: color + "22",
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: palette.text,
          margin: 0,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: palette.textDim, fontSize: 13, margin: "4px 0 20px" }}>
          {subtitle}
        </p>
      )}
      {!subtitle && <div style={{ height: 16 }} />}
      {children}
    </div>
  );
}

function LayerCard({ layer, index }) {
  return (
    <div
      style={{
        background: palette.card,
        border: `1px solid ${palette.border}`,
        borderLeft: `3px solid ${layer.color}`,
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: layer.color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: layer.color,
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        L{index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: palette.text, fontSize: 15 }}>
            {layer.label}
          </span>
          <Badge color={layer.color}>{layer.tech}</Badge>
          <span style={{ fontSize: 10, color: palette.accent, marginLeft: "auto" }}>● LIVE</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
          {layer.items.map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.6 }}>
              → {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressGrid({ items, filter }) {
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const grouped = {
    done: filtered.filter((i) => i.status === "done"),
    doing: filtered.filter((i) => i.status === "doing"),
    todo: filtered.filter((i) => i.status === "todo"),
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      {[
        { key: "done", label: "Done", color: palette.accent, icon: "✅" },
        { key: "doing", label: "In Progress", color: palette.warn, icon: "🔧" },
        { key: "todo", label: "To Do", color: palette.textDim, icon: "📋" },
      ].map((col) => (
        <div key={col.key}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `2px solid ${col.color}33`,
            }}
          >
            <span style={{ fontSize: 14 }}>{col.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>
              {col.label}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 20,
                fontWeight: 800,
                color: col.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {grouped[col.key]?.length || 0}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(grouped[col.key] || []).map((item, i) => (
              <div
                key={i}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 11,
                  color: col.key === "done" ? palette.textDim : palette.text,
                  lineHeight: 1.4,
                  textDecoration: col.key === "done" ? "none" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <span>{item.task}</span>
                  {item.priority && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 3,
                        flexShrink: 0,
                        background:
                          item.priority === "P0"
                            ? palette.errorDim
                            : item.priority === "P1"
                            ? palette.warnDim
                            : palette.blueDim,
                        color:
                          item.priority === "P0"
                            ? palette.error
                            : item.priority === "P1"
                            ? palette.warn
                            : palette.blue,
                      }}
                    >
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoadmapTimeline() {
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div
        style={{
          position: "absolute",
          left: 7,
          top: 8,
          bottom: 8,
          width: 2,
          background: `linear-gradient(to bottom, ${palette.error}, ${palette.warn}, ${palette.blue}, ${palette.accent})`,
          borderRadius: 1,
        }}
      />
      {roadmap.map((phase, i) => (
        <div key={i} style={{ position: "relative", marginBottom: 28 }}>
          <div
            style={{
              position: "absolute",
              left: -20,
              top: 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: phase.color,
              border: `2px solid ${palette.bg}`,
              boxShadow: `0 0 8px ${phase.color}66`,
            }}
          />
          <div
            style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: phase.color }}>
                {phase.phase}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: palette.textDim,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {phase.timeline}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
              {phase.items.map((item, j) => (
                <span key={j} style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.7 }}>
                  → {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const simulatorGoals = [
  {
    id: "product_listing",
    icon: "📦",
    label: "Amazon Product Listing",
    desc: "Title, bullets, description & keywords",
    placeholder: "e.g. Bosch GBA 18V 5.0Ah battery for power tools",
    contentType: "product_listing",
  },
  {
    id: "a_plus",
    icon: "✨",
    label: "A+ / Enhanced Content",
    desc: "Brand story, feature modules, comparison",
    placeholder: "e.g. Premium wireless noise-cancelling headphones",
    contentType: "a_plus_content",
  },
  {
    id: "seo_desc",
    icon: "🔍",
    label: "SEO Descriptions",
    desc: "Meta tags, long description, keywords",
    placeholder: "e.g. Organic bamboo toothbrush set, 4-pack",
    contentType: "seo_description",
  },
  {
    id: "social_ad",
    icon: "📱",
    label: "Social Ad Copy",
    desc: "Headlines, ad text, CTA suggestions",
    placeholder: "e.g. Adjustable standing desk converter",
    contentType: "social_ad",
  },
  {
    id: "bulk_titles",
    icon: "🏷️",
    label: "Bulk Title Generator",
    desc: "Generate SEO titles for multiple SKUs",
    placeholder: "e.g. Car brake pads, fits BMW 3-series 2018-2024",
    contentType: "product_listing",
  },
  {
    id: "translate",
    icon: "🌍",
    label: "Multi-Country Localize",
    desc: "Adapt listing for DE → NL / FR / ES / IT",
    placeholder: "e.g. LED Schreibtischlampe mit USB-Anschluss",
    contentType: "product_listing",
  },
  {
    id: "competitor",
    icon: "⚔️",
    label: "Competitor Differentiator",
    desc: "Analyze and outposition a competitor listing",
    placeholder: "Paste competitor product title or ASIN",
    contentType: "product_listing",
  },
  {
    id: "brand_voice",
    icon: "🎤",
    label: "Brand Voice Content",
    desc: "Generate in your brand's tone and style",
    placeholder: "e.g. Sustainable yoga mat, eco-friendly brand",
    contentType: "product_listing",
  },
  {
    id: "validate",
    icon: "✅",
    label: "Listing Quality Check",
    desc: "Score & validate an existing listing",
    placeholder: "Paste your current product title + bullets",
    contentType: "seo_description",
  },
  {
    id: "export_ready",
    icon: "📤",
    label: "Flatfile-Ready Export",
    desc: "Generate Amazon Seller Central CSV format",
    placeholder: "e.g. Stainless steel water bottle, 750ml, BPA-free",
    contentType: "product_listing",
  },
];

function SimulatorTab() {
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [marketplace, setMarketplace] = useState("Amazon DE");
  const [brandVoice, setBrandVoice] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState("demo");
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [stepTimings, setStepTimings] = useState({});
  const [transferring, setTransferring] = useState(-1); // which gap is animating
  const [tick, setTick] = useState(0);

  // Tick for animations
  const tickRef = { current: null };
  useState(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 120);
    return () => clearInterval(tickRef.current);
  });

  const demoPipeline = [
    { id: "input", label: "Parse Input", icon: "📥", desc: "Extracting product data", data: "product JSON" },
    { id: "context", label: "Build Context", icon: "🧩", desc: "Marketplace + brand voice", data: "prompt context" },
    { id: "generate", label: "AI Generate", icon: "🤖", desc: "Claude Sonnet 4", data: "raw content" },
    { id: "format", label: "Format", icon: "📝", desc: "Markdown structuring", data: "formatted MD" },
    { id: "deliver", label: "Deliver", icon: "✅", desc: "Ready to copy", data: "final output" },
  ];

  const livePipeline = [
    { id: "input", label: "Parse Input", icon: "📥", desc: "Validate product data", data: "validated JSON" },
    { id: "rules", label: "Load Rules", icon: "📏", desc: "14 Amazon rules", data: "rule set" },
    { id: "prompt", label: "Build Prompt", icon: "🧩", desc: "System + user assembly", data: "full prompt" },
    { id: "generate", label: "AI Generate", icon: "⚡", desc: "Claude · strict mode", data: "raw listing" },
    { id: "validate", label: "Validate", icon: "🔍", desc: "Policy + byte check", data: "validated content" },
    { id: "score", label: "Score", icon: "📊", desc: "Quality 0-100", data: "scored result" },
    { id: "deliver", label: "Deliver", icon: "✅", desc: "Export-ready", data: "final output" },
  ];

  const currentPipeline = mode === "demo" ? demoPipeline : livePipeline;

  const simulateStep = (stepIdx) => {
    return new Promise((resolve) => {
      // Start transfer animation from previous step
      if (stepIdx > 0) setTransferring(stepIdx - 1);
      setTimeout(() => {
        setTransferring(-1);
        setPipelineStep(stepIdx);
        setTimeout(() => {
          setStepTimings(prev => ({ ...prev, [stepIdx]: true }));
          resolve();
        }, 200 + Math.random() * 200);
      }, 500); // transfer animation duration
    });
  };

  const runDemo = async () => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system: "You are an expert e-commerce AI content agent for marketplacegrowth.nl. Generate high-converting marketplace content. Respond in the target marketplace language. Format with markdown.",
        messages: [{ role: "user", content: `Task: ${selected.label}\nProduct: ${input}\nMarketplace: ${marketplace}\nBrand Voice: ${brandVoice}\n\nGenerate now.` }],
      }),
    });
    const d = await r.json();
    return d.content?.map(c => c.text || "").join("\n") || "No response";
  };

  const runLive = async () => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        system: `You are the LIVE production content pipeline for marketplacegrowth.nl.\nSTRICT RULES:\n1. Write in TARGET LANGUAGE (DE=German, NL=Dutch, FR=French, ES=Spanish, IT=Italian)\n2. Titles under 200 chars, no promotional claims, no ALL CAPS\n3. Bullets: capital start, benefits + specs\n4. Backend keywords: no commas, no brand names\n5. QUALITY SCORE at end: Completeness(0-25) Readability(0-25) Keywords(0-20) Compliance(0-20) Consistency(0-10) TOTAL: X/100\nFormat with markdown.`,
        messages: [{ role: "user", content: `Content Type: ${selected.contentType}\nProduct: ${input}\nMarketplace: ${marketplace}\nBrand Voice: ${brandVoice}\n\nGenerate with full pipeline compliance + quality score.` }],
      }),
    });
    const d = await r.json();
    return d.content?.filter(c => c.type === "text").map(c => c.text).join("\n") || "No response";
  };

  const handleRun = async () => {
    if (!selected || !input.trim()) return;
    setLoading(true); setResult(null); setError(null);
    setPipelineStep(-1); setStepTimings({}); setTransferring(-1);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(((Date.now() - start) / 1000).toFixed(1)), 100);
    try {
      const steps = currentPipeline;
      const aiIdx = mode === "demo" ? 2 : 3;
      // Pre-AI steps with transfer animations
      for (let i = 0; i < aiIdx; i++) await simulateStep(i);
      // Transfer to AI step
      setTransferring(aiIdx - 1);
      await new Promise(r => setTimeout(r, 500));
      setTransferring(-1);
      setPipelineStep(aiIdx);
      const text = mode === "demo" ? await runDemo() : await runLive();
      setStepTimings(prev => ({ ...prev, [aiIdx]: true }));
      // Post-AI steps
      for (let i = aiIdx + 1; i < steps.length; i++) await simulateStep(i);
      setResult(text);
    } catch (e) { setError(e.message || "Failed"); }
    finally { clearInterval(timer); setElapsed(((Date.now() - start) / 1000).toFixed(1)); setLoading(false); setPipelineStep(-1); setTransferring(-1); }
  };

  const modeConfig = {
    demo: { label: "Demo", sub: "Creative", color: palette.purple, icon: "🤖" },
    live: { label: "Pipeline", sub: "Production", color: palette.accent, icon: "⚡" },
  };

  // ── Animated pixel ring ──
  const PixelRing = ({ pct, active, done }) => {
    const s = 52, px = 3, cx = s/2, cy = s/2, r = 20, n = 32;
    const filled = Math.floor((pct / 100) * n);
    return (
      <svg width={s} height={s} style={{ imageRendering: "pixelated", flexShrink: 0 }}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = Math.round((cx + Math.cos(a) * r - px/2) / px) * px;
          const y = Math.round((cy + Math.sin(a) * r - px/2) / px) * px;
          const on = i < filled;
          const edge = i === filled && active;
          return <rect key={i} x={x} y={y} width={px} height={px}
            fill={on ? "#f97316" : edge ? "#fb923c" : "#1e1e2e"}
            opacity={edge ? (0.3 + ((tick % 5) / 5) * 0.7) : 1} />;
        })}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
          fill={done ? "#f97316" : active ? "#fb923c" : palette.textMuted}
          fontSize={done ? 12 : 10} fontWeight={800} fontFamily="'JetBrains Mono', monospace">
          {done ? "✓" : `${Math.round(pct)}%`}
        </text>
      </svg>
    );
  };

  // ── Data transfer particles between steps ──
  const TransferBridge = ({ active, dataLabel }) => {
    // 3 paper/packet icons floating left→right
    const particles = [0, 1, 2];
    return (
      <div style={{
        width: 40, height: 32, position: "relative", overflow: "hidden", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active ? particles.map(i => {
          const phase = ((tick + i * 4) % 12) / 12; // 0→1 across bridge
          const x = phase * 32 - 2;
          const opacity = phase < 0.1 || phase > 0.9 ? 0.2 : 0.9;
          const scale = 0.7 + Math.sin(phase * Math.PI) * 0.3;
          return (
            <div key={i} style={{
              position: "absolute",
              left: x,
              top: 8 + Math.sin((tick + i * 3) * 0.5) * 3,
              fontSize: 10,
              opacity,
              transform: `scale(${scale})`,
              transition: "none",
              filter: "drop-shadow(0 0 3px #f97316)",
            }}>📄</div>
          );
        }) : (
          <div style={{ width: 24, height: 2, background: palette.border, borderRadius: 1 }} />
        )}
        {active && (
          <div style={{
            position: "absolute", bottom: 0, left: 4, right: 4,
            fontSize: 6, color: "#f97316", textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            letterSpacing: 0.3, opacity: 0.8,
          }}>{dataLabel}</div>
        )}
      </div>
    );
  };

  // ── Single step card ──
  const StepCard = ({ step, i, isDone, isActive, isFuture }) => (
    <div style={{
      flex: 1, minWidth: 0,
      background: isDone ? "#f9731616" : isActive ? "#f9731610" : "#0c0c14",
      border: `1.5px solid ${isDone ? "#f9731666" : isActive ? "#f97316bb" : "#1a1a28"}`,
      borderRadius: 8, padding: "10px 6px 8px", textAlign: "center",
      position: "relative", overflow: "hidden",
      transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
      boxShadow: isActive ? "0 0 16px #f9731633, inset 0 0 20px #f9731608" : "none",
      transform: isActive ? "scale(1.04)" : "scale(1)",
    }}>
      {/* CRT scanlines on active */}
      {isActive && <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, #f9731606 2px, #f9731606 4px)",
      }} />}
      {/* Glow pulse on active */}
      {isActive && <div style={{
        position: "absolute", inset: -1, borderRadius: 8, pointerEvents: "none",
        border: "1.5px solid #f97316",
        opacity: 0.3 + ((tick % 6) / 6) * 0.5,
      }} />}

      <div style={{
        fontSize: 18, marginBottom: 3,
        filter: isFuture ? "grayscale(1) opacity(0.25)" : "none",
        transition: "filter 0.3s",
      }}>
        {isDone ? "🟧" : step.icon}
      </div>
      <div style={{
        fontSize: 7.5, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
        color: isDone ? "#f97316" : isActive ? "#fb923c" : isFuture ? "#2a2a3a" : palette.textDim,
        letterSpacing: 0.4, textTransform: "uppercase", lineHeight: 1.2,
        transition: "color 0.3s",
      }}>{step.label}</div>

      {/* Status line */}
      <div style={{
        marginTop: 3, fontSize: 6.5,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        height: 10, overflow: "hidden",
      }}>
        {isDone && <span style={{ color: "#f97316" }}>✓ DONE</span>}
        {isActive && <span style={{ color: "#fb923c", animation: "blink 0.7s step-end infinite" }}>▶ RUNNING</span>}
        {isFuture && <span style={{ color: "#1e1e2e" }}>WAITING</span>}
        {!isDone && !isActive && !isFuture && !loading && <span style={{ color: palette.textMuted }}>READY</span>}
      </div>
    </div>
  );

  // ── Full pipeline viz ──
  const PipelineViz = () => {
    const steps = currentPipeline;
    const completedSteps = Object.keys(stepTimings).length;
    const totalPct = result ? 100 : loading ? Math.min(98, (completedSteps / steps.length) * 100 + (pipelineStep >= 0 ? 5 : 0)) : 0;

    return (
      <div style={{
        background: "linear-gradient(180deg, #0a0a12, #0d0d16)",
        border: `1px solid ${loading ? "#f9731633" : palette.border}`,
        borderRadius: 12, padding: "18px 16px 14px", marginBottom: 16,
        transition: "border-color 0.5s",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <PixelRing pct={totalPct} active={loading} done={!!result && !error} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800,
              color: loading ? "#f97316" : result ? palette.accent : palette.textDim,
              letterSpacing: 0.5, transition: "color 0.3s",
            }}>
              {loading && pipelineStep >= 0
                ? `STEP ${pipelineStep + 1}/${steps.length} · ${steps[pipelineStep]?.label.toUpperCase()}`
                : loading ? "INITIALIZING PIPELINE..."
                : result ? "PIPELINE COMPLETE" : `${steps.length}-STEP PIPELINE`}
            </div>
            <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
              {loading && pipelineStep >= 0 ? steps[pipelineStep]?.desc
                : result ? `Completed in ${elapsed}s · ${steps.length} steps · ${marketplace}`
                : mode === "demo" ? "5 steps · Claude Sonnet 4 · creative" : "7 steps · production rules · quality score"}
            </div>
          </div>
          {loading && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 900,
              color: "#f97316", textShadow: "0 0 14px #f9731666, 0 0 4px #f97316",
              letterSpacing: -1,
            }}>{elapsed}<span style={{ fontSize: 12, opacity: 0.6 }}>s</span></div>
          )}
        </div>

        {/* Step cards with transfer bridges */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {steps.map((step, i) => {
            const isDone = !!stepTimings[i] || (!!result && !error);
            const isActive = loading && i === pipelineStep;
            const isFuture = loading && i > pipelineStep && !stepTimings[i];
            const showTransfer = i < steps.length - 1;
            const isTransferActive = transferring === i;
            // Also show transfer as "done" if both sides are done
            const isTransferDone = (!!stepTimings[i] && (!!stepTimings[i + 1] || i + 1 === pipelineStep)) || (!!result && !error);

            return (
              <div key={step.id} style={{ display: "contents" }}>
                <StepCard step={step} i={i} isDone={isDone} isActive={isActive} isFuture={isFuture} />
                {showTransfer && (
                  <TransferBridge
                    active={isTransferActive}
                    dataLabel={step.data}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 12, height: 3, background: "#141420", borderRadius: 2,
          overflow: "hidden", imageRendering: "pixelated",
        }}>
          <div style={{
            height: "100%", width: `${totalPct}%`,
            background: "linear-gradient(90deg, #ea580c, #f97316, #fb923c)",
            borderRadius: 2,
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
            boxShadow: loading ? "0 0 8px #f97316, 0 1px 2px #f9731666" : "none",
          }} />
        </div>
      </div>
    );
  };

  return (
    <Section title="AI Simulator" subtitle="Test your AI agents — pick a goal, enter a product, watch the pipeline">
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 3, marginBottom: 20, background: palette.card, borderRadius: 8, padding: 3, border: `1px solid ${palette.border}`, maxWidth: 400 }}>
        {Object.entries(modeConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => { setMode(key); setResult(null); setError(null); setPipelineStep(-1); setStepTimings({}); setTransferring(-1); }} style={{
            flex: 1, padding: "10px 16px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12,
            fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
            background: mode === key ? cfg.color + "18" : "transparent", color: mode === key ? cfg.color : palette.textDim,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span>{cfg.icon}</span><span>{cfg.label}</span><span style={{ fontSize: 9, opacity: 0.7 }}>({cfg.sub})</span>
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{
        background: mode === "live" ? palette.accentDim : palette.purpleDim,
        border: `1px solid ${mode === "live" ? palette.accent + "33" : palette.purple + "33"}`,
        borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 11,
        color: mode === "live" ? palette.accent : palette.purple, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>{modeConfig[mode].icon}</span>
        {mode === "demo"
          ? <span><strong>Demo</strong> — 5-step creative pipeline. Claude Sonnet 4, flexible output.</span>
          : <span><strong>Production</strong> — 7-step strict pipeline. Marketplace language, validation, quality score (0-100).</span>}
      </div>

      {/* Goals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 24 }}>
        {simulatorGoals.map(g => (
          <button key={g.id} onClick={() => { setSelected(g); setResult(null); setError(null); setPipelineStep(-1); setStepTimings({}); setTransferring(-1); }} style={{
            background: selected?.id === g.id ? (mode === "live" ? palette.accent : palette.purple) + "18" : palette.card,
            border: `1px solid ${selected?.id === g.id ? (mode === "live" ? palette.accent : palette.purple) + "66" : palette.border}`,
            borderRadius: 8, padding: "12px 10px", cursor: "pointer", textAlign: "center", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: selected?.id === g.id ? (mode === "live" ? palette.accent : palette.purple) : palette.text, lineHeight: 1.3, marginBottom: 2 }}>{g.label}</div>
            <div style={{ fontSize: 9, color: palette.textDim, lineHeight: 1.3 }}>{g.desc}</div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <PipelineViz />

          <div style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{selected.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: palette.text }}>{selected.label}</span>
              <Badge color={mode === "live" ? palette.accent : palette.purple}>{mode === "live" ? "PRODUCTION" : "DEMO"}</Badge>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: palette.textDim, display: "block", marginBottom: 4 }}>Product / Input</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={selected.placeholder} rows={3} style={{
                width: "100%", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 6, padding: "10px 12px",
                color: palette.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Marketplace", value: marketplace, setter: setMarketplace, opts: ["Amazon DE","Amazon NL","Amazon FR","Amazon ES","Amazon IT","Bol.com","Shopify"] },
                { label: "Brand Voice", value: brandVoice, setter: setBrandVoice, opts: ["Professional","Casual & Friendly","Premium / Luxury","Technical / Expert","Playful & Bold","Eco-Conscious"] },
              ].map(sel => (
                <div key={sel.label} style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: palette.textDim, display: "block", marginBottom: 4 }}>{sel.label}</label>
                  <select value={sel.value} onChange={e => sel.setter(e.target.value)} style={{
                    width: "100%", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 6,
                    padding: "8px 10px", color: palette.text, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                    {sel.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={handleRun} disabled={loading || !input.trim()} style={{
              width: "100%", padding: "12px 24px", border: "none", borderRadius: 8, cursor: loading ? "wait" : "pointer",
              fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
              background: loading ? palette.border : mode === "live" ? "linear-gradient(135deg, #f97316, #ea580c)" : `linear-gradient(135deg, ${palette.purple}, #7c3aed)`,
              color: loading ? palette.textDim : "#fff", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading
                ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>Pipeline running... {elapsed}s</>
                : <>{mode === "live" ? "⚡ Run Production Pipeline" : "🤖 Generate with Claude"}</>}
            </button>
          </div>
        </>
      )}

      {(result || error) && (
        <div style={{ background: palette.card, border: `1px solid ${error ? palette.error + "44" : "#f9731644"}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: error ? palette.error : "#f97316" }}>
              {error ? "⛔ Pipeline Failed" : "🟧 Pipeline Complete"}</span>
            <span style={{ fontSize: 11, color: palette.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
              {elapsed}s · {currentPipeline.length} steps · {marketplace}</span>
            {!error && <Badge color="#f97316">{mode === "live" ? "PRODUCTION" : "DEMO"}</Badge>}
          </div>
          {error
            ? <div style={{ fontSize: 13, color: palette.error, lineHeight: 1.6 }}>{error}</div>
            : <div style={{ fontSize: 13, color: palette.text, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto", fontFamily: "inherit" }}>{result}</div>}
        </div>
      )}
    </Section>
  );
}

// ── MAIN ──────────────────────────────────────

export default function GodStructureDashboard() {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Architecture" },
    { id: "agents", label: "Agents" },
    { id: "simulator", label: "Simulator" },
    { id: "progress", label: "Progress" },
    { id: "services", label: "Services" },
    { id: "roadmap", label: "Roadmap" },
  ];

  const doneCount = progressItems.filter((i) => i.status === "done").length;
  const totalCount = progressItems.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "32px 24px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: palette.accent,
              boxShadow: `0 0 12px ${palette.accent}`,
              animation: "pulse 2s infinite",
            }}
          />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              letterSpacing: -1,
              background: `linear-gradient(135deg, ${palette.text}, ${palette.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GOD STRUCTURE
          </h1>
          <Badge color={palette.accent}>v2.0</Badge>
        </div>
        <p style={{ color: palette.textDim, fontSize: 13, margin: 0 }}>
          AI Empire · marketplacegrowth.nl · {doneCount}/{totalCount} tasks complete ({pct}%)
        </p>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 12,
            height: 4,
            background: palette.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${palette.accent}, ${palette.blue})`,
              borderRadius: 2,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 32,
          background: palette.card,
          borderRadius: 8,
          padding: 3,
          border: `1px solid ${palette.border}`,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "all 0.15s",
              background: tab === t.id ? palette.accent + "18" : "transparent",
              color: tab === t.id ? palette.accent : palette.textDim,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <>
          <Section
            title="Network Architecture"
            subtitle="6 layers working together — all live"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {layers.map((layer, i) => (
                <div key={layer.id}>
                  <LayerCard layer={layer} index={i} />
                  {i < layers.length - 1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 0 4px 48px",
                      }}
                    >
                      <span style={{ color: palette.textMuted, fontSize: 11 }}>
                        ↕ {connections[i]?.label || ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Data Flow">
            <div
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: 20,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 12,
                lineHeight: 1.8,
                color: palette.textDim,
                whiteSpace: "pre",
                overflow: "auto",
              }}
            >
{`User → marketplacegrowth.nl (Vercel CDN)
  │
  ├─ Public pages: instant static serve
  ├─ /auth: Supabase Auth (email + Google OAuth)
  └─ /app/*: authenticated SPA
       │
       ├─ CRUD ──→ Supabase PostgREST (RLS enforced)
       │           workspaces → brands → projects → listings
       │
       ├─ AI Gen ─→ Edge Function (content-builder-generate)
       │              └─→ Gemini API → quality score → save to DB
       │
       └─ Export ─→ Edge Function (content-builder-export)
                      └─→ Amazon flatfile CSV / JSON

n8n (VPS) runs independently:
  ├─ Every 5 min:  Docker health + endpoint checks
  ├─ Every 15 min: State snapshots + change detection
  └─ On webhook:   Claude Relay → any n8n API action`}
            </div>
          </Section>
        </>
      )}

      {tab === "agents" && (
        <Section
          title="Agent Registry"
          subtitle={`${agents.filter(a => a.status === "active").length} active · ${agents.filter(a => a.status === "idle").length} idle · ${agents.filter(a => a.status === "inactive").length} inactive — ${agents.length} total agents`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {agents.map((agent, i) => (
              <div
                key={i}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderLeft: `3px solid ${agent.color}`,
                  borderRadius: 10,
                  padding: "18px 20px",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: agent.status === "active" ? palette.accent : agent.status === "idle" ? palette.warn : palette.textMuted,
                      boxShadow: agent.status === "active" ? `0 0 8px ${palette.accent}66` : "none",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 15, color: palette.text }}>{agent.name}</span>
                  <Badge color={agent.color}>{agent.type}</Badge>
                  <span style={{ fontSize: 10, color: palette.textDim, marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace" }}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: 24, marginBottom: 10, fontSize: 11, color: palette.textDim }}>
                  <span>📍 {agent.location}</span>
                  <span>⚡ {agent.trigger}</span>
                </div>

                {/* Role */}
                <p style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.6, margin: "0 0 14px" }}>
                  {agent.role}
                </p>

                {/* Capabilities + Limitations side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.accent, marginBottom: 6, letterSpacing: 0.5 }}>
                      CAPABILITIES
                    </div>
                    {agent.capabilities.map((cap, j) => (
                      <div key={j} style={{ fontSize: 11, color: palette.text, lineHeight: 1.5, paddingLeft: 12, position: "relative", marginBottom: 3 }}>
                        <span style={{ position: "absolute", left: 0, color: palette.accent }}>+</span>
                        {cap}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.error, marginBottom: 6, letterSpacing: 0.5 }}>
                      LIMITATIONS
                    </div>
                    {agent.limitations.map((lim, j) => (
                      <div key={j} style={{ fontSize: 11, color: palette.textDim, lineHeight: 1.5, paddingLeft: 12, position: "relative", marginBottom: 3 }}>
                        <span style={{ position: "absolute", left: 0, color: palette.error }}>−</span>
                        {lim}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "progress" && (
        <Section
          title="Progress Tracker"
          subtitle={`${doneCount} done · ${progressItems.filter(i => i.status === "doing").length} in progress · ${progressItems.filter(i => i.status === "todo").length} remaining`}
        >
          <ProgressGrid items={progressItems} filter="all" />
        </Section>
      )}

      {tab === "services" && (
        <Section title="Connected Services" subtitle="All 10 services operational">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {serviceMap.map((svc, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 200px 60px",
                  alignItems: "center",
                  gap: 12,
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 700, color: palette.text }}>{svc.name}</span>
                <span
                  style={{
                    color: palette.textDim,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {svc.id}
                </span>
                <span style={{ color: palette.textDim }}>{svc.role}</span>
                <span style={{ color: palette.accent, fontWeight: 700, textAlign: "right", fontSize: 10 }}>
                  ● LIVE
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "roadmap" && (
        <Section
          title="Roadmap"
          subtitle="From security fixes to first paying customers"
        >
          <RoadmapTimeline />
        </Section>
      )}

      {tab === "simulator" && (
        <SimulatorTab />
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 16,
          borderTop: `1px solid ${palette.border}`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: palette.textMuted,
        }}
      >
        <span>Hans van Leeuwen · AI Empire</span>
        <span>Updated: 2026-03-08</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${palette.bg}; }
        ::-webkit-scrollbar-thumb { background: ${palette.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
