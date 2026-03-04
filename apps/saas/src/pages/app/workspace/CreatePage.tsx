import { useState } from "react";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Outlet, useLocation } from "react-router-dom";
import ContentGeneration from "@/pages/ContentGeneration";
import ContentBuilderWizard from "@/components/content-builder/ContentBuilderWizard";
import { Sparkles, Layers } from "lucide-react";

export default function CreatePage() {
  const location = useLocation();
  const isIndex = location.pathname.endsWith("/create");
  const [mode, setMode] = useState<"quick" | "builder">("builder");

  if (!isIndex) return <><Breadcrumbs /><Outlet /></>;

  return (
    <div>
      <Breadcrumbs />

      {/* Mode switcher */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => setMode("builder")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "builder" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Content Builder
        </button>
        <button
          onClick={() => setMode("quick")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "quick" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Quick Generate
        </button>
      </div>

      {mode === "builder" ? <ContentBuilderWizard /> : <ContentGeneration />}
    </div>
  );
}
