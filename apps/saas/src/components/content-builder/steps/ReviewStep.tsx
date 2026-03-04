import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { ProductInput, ContentProject } from "@/lib/content-builder/types";

interface ReviewStepProps {
  project: ContentProject;
  products: ProductInput[];
  onComplete: () => void;
  onBack: () => void;
}

interface ListingData {
  id: string;
  product_input_id: string;
  field_type: string;
  content_text: string;
  quality_score: number | null;
  validation_errors: Array<{ severity: string; message: string }>;
  version: number;
}

interface ProductReview {
  input: ProductInput;
  listings: ListingData[];
  avgScore: number;
  errorCount: number;
  warningCount: number;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  bullets: "Bullet Points",
  description: "Description",
  backend_keywords: "Backend Keywords",
  a_plus_brand_story: "A+ Brand Story",
  a_plus_features: "A+ Features",
  a_plus_comparison: "A+ Comparison",
  image_brief: "Image Brief",
};

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function ReviewStep({ project, products, onComplete, onBack }: ReviewStepProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    const productReviews: ProductReview[] = [];

    for (const input of products) {
      const { data: listings } = await supabase
        .from("generated_listings")
        .select("*")
        .eq("product_input_id", input.id)
        .order("version", { ascending: false });

      const latestByField: Record<string, ListingData> = {};
      for (const l of (listings ?? []) as unknown as ListingData[]) {
        if (!latestByField[l.field_type]) {
          latestByField[l.field_type] = l;
        }
      }

      const allListings = Object.values(latestByField);
      const scores = allListings.map((l) => l.quality_score).filter((s): s is number => s !== null);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const allErrors = allListings.flatMap((l) => l.validation_errors ?? []);

      productReviews.push({
        input,
        listings: allListings,
        avgScore,
        errorCount: allErrors.filter((e) => e.severity === "error").length,
        warningCount: allErrors.filter((e) => e.severity === "warning").length,
      });
    }

    setReviews(productReviews);
    setLoading(false);
    if (productReviews.length > 0) {
      setExpandedProduct(productReviews[0].input.id);
    }
  }

  async function handleRepairAll() {
    setRepairing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? API_KEY;

      await fetch(`${BASE_URL}/functions/v1/content-builder-repair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: API_KEY,
        },
        body: JSON.stringify({ project_id: project.id, auto_fix_all: true }),
      });

      await fetch(`${BASE_URL}/functions/v1/content-builder-validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: API_KEY,
        },
        body: JSON.stringify({ project_id: project.id }),
      });

      await loadReviews();
    } catch (err) {
      console.error("Repair failed:", err);
    } finally {
      setRepairing(false);
    }
  }

  const totalErrors = reviews.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = reviews.reduce((sum, r) => sum + r.warningCount, 0);
  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.avgScore, 0) / reviews.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading review data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review & Validate</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review generated content, check quality scores, and fix validation issues.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold">{reviews.length}</p>
          <p className="text-xs text-muted-foreground">Products</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 60 ? "text-yellow-600" : "text-destructive"}`}>
            {avgScore}/100
          </p>
          <p className="text-xs text-muted-foreground">Avg Quality Score</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className={`text-2xl font-bold ${totalErrors > 0 ? "text-destructive" : "text-green-600"}`}>
            {totalErrors}
          </p>
          <p className="text-xs text-muted-foreground">Errors</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className={`text-2xl font-bold ${totalWarnings > 0 ? "text-yellow-600" : "text-green-600"}`}>
            {totalWarnings}
          </p>
          <p className="text-xs text-muted-foreground">Warnings</p>
        </div>
      </div>

      {/* Repair all button */}
      {(totalErrors > 0 || totalWarnings > 0) && (
        <Button
          onClick={handleRepairAll}
          disabled={repairing}
          variant="outline"
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          {repairing ? "Fixing issues..." : `Fix all ${totalErrors + totalWarnings} issues`}
        </Button>
      )}

      {/* Product accordion */}
      <div className="space-y-2">
        {reviews.map((review) => (
          <div key={review.input.id} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpandedProduct(expandedProduct === review.input.id ? null : review.input.id)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  review.avgScore >= 80 ? "bg-green-500/10 text-green-600" :
                  review.avgScore >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {review.avgScore}
                </span>
                <div>
                  <p className="text-sm font-medium">{review.input.product_name}</p>
                  <p className="text-xs text-muted-foreground">{review.input.sku} {review.input.brand ? `· ${review.input.brand}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.errorCount > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{review.errorCount} errors</Badge>
                )}
                {review.warningCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{review.warningCount} warnings</Badge>
                )}
                {review.errorCount === 0 && review.warningCount === 0 && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {expandedProduct === review.input.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {expandedProduct === review.input.id && (
              <div className="border-t border-border divide-y divide-border">
                {review.listings.map((listing) => (
                  <div key={listing.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {FIELD_LABELS[listing.field_type] ?? listing.field_type}
                      </span>
                      {listing.quality_score !== null && (
                        <span className={`text-xs font-medium ${
                          listing.quality_score >= 80 ? "text-green-600" :
                          listing.quality_score >= 60 ? "text-yellow-600" :
                          "text-destructive"
                        }`}>
                          {listing.quality_score}/100
                        </span>
                      )}
                    </div>
                    <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                      {listing.content_text || <span className="text-muted-foreground italic">No content generated</span>}
                    </div>
                    {listing.validation_errors?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {listing.validation_errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            <AlertTriangle className={`h-3 w-3 mt-0.5 shrink-0 ${
                              err.severity === "error" ? "text-destructive" : "text-yellow-500"
                            }`} />
                            <span className={err.severity === "error" ? "text-destructive" : "text-yellow-600"}>
                              {err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onComplete} size="lg" className="gap-2">
          Approve & Export
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
