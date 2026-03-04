import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ProductInput, ContentProject } from "@/lib/content-builder/types";

interface GenerateStepProps {
  project: ContentProject;
  products: ProductInput[];
  onComplete: () => void;
  onBack: () => void;
}

interface GenerationStatus {
  sku: string;
  product_name: string;
  status: "pending" | "generating" | "done" | "error";
  fields_generated: number;
  error?: string;
}

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? API_KEY;

  const resp = await fetch(`${BASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `${name} failed`);
  }

  return resp.json();
}

export default function GenerateStep({ project, products, onComplete, onBack }: GenerateStepProps) {
  const [statuses, setStatuses] = useState<GenerationStatus[]>(
    products.map((p) => ({
      sku: p.sku,
      product_name: p.product_name,
      status: "pending",
      fields_generated: 0,
    }))
  );
  const [phase, setPhase] = useState<"idle" | "normalizing" | "generating" | "validating" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  const totalFields = products.length * 6;
  const completedFields = statuses.reduce((sum, s) => sum + s.fields_generated, 0);
  const progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runPipeline();
  }, []);

  async function runPipeline() {
    try {
      setPhase("normalizing");
      await callEdgeFunction("content-builder-normalize", { project_id: project.id });

      setPhase("generating");
      setStatuses((prev) => prev.map((s) => ({ ...s, status: "generating" })));

      const genResult = await callEdgeFunction("content-builder-generate", { project_id: project.id });

      if (genResult.results) {
        setStatuses((prev) =>
          prev.map((s) => {
            const result = genResult.results.find((r: { sku: string }) => r.sku === s.sku);
            if (!result) return s;
            return {
              ...s,
              status: result.errors?.length > 0 ? "error" : "done",
              fields_generated: result.fields_generated?.length ?? 0,
              error: result.errors?.length > 0 ? `Failed: ${result.errors.join(", ")}` : undefined,
            };
          })
        );
      }

      setPhase("validating");
      await callEdgeFunction("content-builder-validate", { project_id: project.id });

      setPhase("done");
    } catch (err) {
      console.error("Pipeline error:", err);
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Generation failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Generating Content</h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI is creating optimized listings for {products.length} product{products.length !== 1 ? "s" : ""} on {project.marketplace} {project.target_country}.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {phase === "normalizing" && "Normalizing product data..."}
            {phase === "generating" && "Generating content..."}
            {phase === "validating" && "Validating against marketplace rules..."}
            {phase === "done" && "Generation complete"}
            {phase === "error" && "Generation failed"}
            {phase === "idle" && "Starting..."}
          </span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              phase === "error" ? "bg-destructive" : phase === "done" ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${phase === "done" ? 100 : phase === "error" ? progress : Math.max(progress, 5)}%` }}
          />
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-6 text-sm">
        {(["normalizing", "generating", "validating"] as const).map((p) => {
          const phaseOrder = ["normalizing", "generating", "validating"];
          const currentOrder = phaseOrder.indexOf(phase);
          const thisOrder = phaseOrder.indexOf(p);
          const isDone = phase === "done" || thisOrder < currentOrder;
          const isCurrent = p === phase;

          return (
            <div key={p} className="flex items-center gap-1.5">
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
              )}
              <span className={isDone ? "text-green-600" : isCurrent ? "text-primary font-medium" : "text-muted-foreground"}>
                {p === "normalizing" ? "Normalize" : p === "generating" ? "Generate" : "Validate"}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Product statuses */}
      <div className="rounded-lg border border-border overflow-hidden max-h-[350px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fields</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.sku} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{s.sku}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{s.product_name}</td>
                <td className="px-3 py-2">
                  {s.status === "pending" && <span className="text-muted-foreground">Waiting</span>}
                  {s.status === "generating" && (
                    <span className="flex items-center gap-1 text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" /> Generating
                    </span>
                  )}
                  {s.status === "done" && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  )}
                  {s.status === "error" && (
                    <span className="flex items-center gap-1 text-destructive" title={s.error}>
                      <XCircle className="h-3 w-3" /> Error
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{s.fields_generated}/6</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2" disabled={phase === "generating"}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={phase !== "done" && phase !== "error"}
          size="lg"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Review Results
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
