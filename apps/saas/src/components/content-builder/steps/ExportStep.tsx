import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ContentProject } from "@/lib/content-builder/types";

interface ExportStepProps {
  project: ContentProject;
  onBack: () => void;
}

const FORMATS = [
  {
    id: "amazon_flatfile_csv" as const,
    label: "Amazon Flatfile CSV",
    description: "Category-specific CSV ready for Seller Central upload",
    icon: FileSpreadsheet,
  },
  {
    id: "sp_api_json" as const,
    label: "JSON Export",
    description: "Structured JSON for API integration or further processing",
    icon: FileJson,
  },
];

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function ExportStep({ project, onBack }: ExportStepProps) {
  const [selectedFormat, setSelectedFormat] = useState<"amazon_flatfile_csv" | "sp_api_json">("amazon_flatfile_csv");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? API_KEY;

      const resp = await fetch(`${BASE_URL}/functions/v1/content-builder-export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: API_KEY,
        },
        body: JSON.stringify({
          project_id: project.id,
          format: selectedFormat,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }

      if (selectedFormat === "amazon_flatfile_csv") {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_${project.target_country}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("CSV downloaded successfully!");
      } else {
        const data = await resp.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_${project.target_country}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("JSON downloaded successfully!");
      }

      setExported(true);
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Export Content</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Download your generated content in the format you need.
        </p>
      </div>

      {/* Format selection */}
      <div className="grid gap-3 md:grid-cols-2">
        {FORMATS.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => setSelectedFormat(fmt.id)}
            className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-colors ${
              selectedFormat === fmt.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <fmt.icon className={`h-8 w-8 shrink-0 ${selectedFormat === fmt.id ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className={`font-medium ${selectedFormat === fmt.id ? "text-primary" : ""}`}>
                {fmt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{fmt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Project summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium mb-2">Export Summary</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Project:</span>{" "}
            <span className="font-medium">{project.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Marketplace:</span>{" "}
            <span className="font-medium">{project.marketplace} {project.target_country}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Format:</span>{" "}
            <span className="font-medium">{FORMATS.find((f) => f.id === selectedFormat)?.label}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tone:</span>{" "}
            <span className="font-medium capitalize">{project.tone_of_voice}</span>
          </div>
        </div>
      </div>

      {/* Export success */}
      {exported && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-600">Export successful!</p>
            <p className="text-xs text-muted-foreground">Your file has been downloaded. You can upload it directly to Seller Central.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Review
        </Button>
        <Button
          onClick={handleExport}
          disabled={exporting}
          size="lg"
          className="gap-2"
        >
          {exporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
          ) : (
            <><Download className="h-4 w-4" /> Download {selectedFormat === "amazon_flatfile_csv" ? "CSV" : "JSON"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
