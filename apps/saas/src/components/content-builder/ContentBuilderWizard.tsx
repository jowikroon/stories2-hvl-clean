import { useState } from "react";
import { Check } from "lucide-react";
import ImportStep from "./steps/ImportStep";
import ConfigureStep from "./steps/ConfigureStep";
import GenerateStep from "./steps/GenerateStep";
import ReviewStep from "./steps/ReviewStep";
import ExportStep from "./steps/ExportStep";
import type { ProductInput, ContentProject } from "@/lib/content-builder/types";

const STEPS = [
  { id: "import", label: "Import", description: "Upload product data" },
  { id: "configure", label: "Configure", description: "Marketplace & voice" },
  { id: "generate", label: "Generate", description: "AI content creation" },
  { id: "review", label: "Review", description: "Quality & validation" },
  { id: "export", label: "Export", description: "Download & publish" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function ContentBuilderWizard() {
  const [currentStep, setCurrentStep] = useState<StepId>("import");
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [project, setProject] = useState<ContentProject | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  function goToStep(step: StepId) {
    setCurrentStep(step);
  }

  function completeStep(step: StepId) {
    setCompletedSteps((prev) => new Set([...prev, step]));
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav className="flex items-center gap-1" aria-label="Progress">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = i < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              {i > 0 && (
                <div className={`mx-2 h-px w-8 transition-colors ${isPast || isCompleted ? "bg-primary" : "bg-border"}`} />
              )}
              <button
                onClick={() => (isCompleted || isPast) && goToStep(step.id)}
                disabled={!isCompleted && !isPast && !isCurrent}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-medium"
                    : isCompleted
                      ? "text-primary hover:bg-primary/5 cursor-pointer"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-2 border-primary text-primary"
                        : "border border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="hidden md:block text-left">
                  <p className="leading-none">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground font-normal">{step.description}</p>
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="min-h-[500px]">
        {currentStep === "import" && (
          <ImportStep
            products={products}
            onProductsChange={setProducts}
            onComplete={() => completeStep("import")}
          />
        )}
        {currentStep === "configure" && (
          <ConfigureStep
            products={products}
            project={project}
            onProjectChange={setProject}
            onComplete={() => completeStep("configure")}
            onBack={() => goToStep("import")}
          />
        )}
        {currentStep === "generate" && project && (
          <GenerateStep
            project={project}
            products={products}
            onComplete={() => completeStep("generate")}
            onBack={() => goToStep("configure")}
          />
        )}
        {currentStep === "review" && project && (
          <ReviewStep
            project={project}
            products={products}
            onComplete={() => completeStep("review")}
            onBack={() => goToStep("generate")}
          />
        )}
        {currentStep === "export" && project && (
          <ExportStep
            project={project}
            onBack={() => goToStep("review")}
          />
        )}
      </div>
    </div>
  );
}
