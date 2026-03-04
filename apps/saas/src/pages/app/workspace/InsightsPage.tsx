import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { BarChart3, AlertTriangle, CheckCircle2, TrendingUp, FileText, Layers } from "lucide-react";

interface InsightData {
  totalProjects: number;
  totalListings: number;
  avgQualityScore: number;
  scoreDistribution: { range: string; count: number }[];
  topIssues: { message: string; count: number }[];
  fieldCompleteness: { field: string; percentage: number }[];
}

export default function InsightsPage() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadInsights();
  }, [currentWorkspace?.id]);

  async function loadInsights() {
    setLoading(true);

    const { data: projects } = await supabase
      .from("content_projects")
      .select("id")
      .eq("workspace_id", currentWorkspace!.id);

    const projectIds = (projects ?? []).map((p) => p.id);

    if (projectIds.length === 0) {
      setData({
        totalProjects: 0,
        totalListings: 0,
        avgQualityScore: 0,
        scoreDistribution: [],
        topIssues: [],
        fieldCompleteness: [],
      });
      setLoading(false);
      return;
    }

    const { data: inputs } = await supabase
      .from("product_inputs")
      .select("id")
      .in("project_id", projectIds);

    const inputIds = (inputs ?? []).map((i) => i.id);

    if (inputIds.length === 0) {
      setData({
        totalProjects: projectIds.length,
        totalListings: 0,
        avgQualityScore: 0,
        scoreDistribution: [],
        topIssues: [],
        fieldCompleteness: [],
      });
      setLoading(false);
      return;
    }

    const { data: listings } = await supabase
      .from("generated_listings")
      .select("field_type, quality_score, validation_errors, content_text")
      .in("product_input_id", inputIds);

    const allListings = listings ?? [];
    const scores = allListings.map((l) => l.quality_score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const distribution = [
      { range: "90-100", count: scores.filter((s) => s >= 90).length },
      { range: "80-89", count: scores.filter((s) => s >= 80 && s < 90).length },
      { range: "60-79", count: scores.filter((s) => s >= 60 && s < 80).length },
      { range: "0-59", count: scores.filter((s) => s < 60).length },
    ];

    const issueMap = new Map<string, number>();
    for (const l of allListings) {
      const errors = l.validation_errors as Array<{ message: string }> ?? [];
      for (const e of errors) {
        issueMap.set(e.message, (issueMap.get(e.message) ?? 0) + 1);
      }
    }
    const topIssues = [...issueMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    const fields = ["title", "bullets", "description", "backend_keywords", "a_plus_brand_story", "a_plus_features"];
    const fieldCompleteness = fields.map((f) => {
      const fieldListings = allListings.filter((l) => l.field_type === f);
      const filled = fieldListings.filter((l) => (l.content_text ?? "").length > 10).length;
      return {
        field: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        percentage: inputIds.length > 0 ? Math.round((filled / inputIds.length) * 100) : 0,
      };
    });

    setData({
      totalProjects: projectIds.length,
      totalListings: allListings.length,
      avgQualityScore: avgScore,
      scoreDistribution: distribution,
      topIssues,
      fieldCompleteness,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <p className="text-muted-foreground py-10 text-center">Loading insights...</p>
      </div>
    );
  }

  if (!data || data.totalListings === 0) {
    return (
      <div>
        <Breadcrumbs />
        <h1 className="text-2xl font-bold mb-1">Insights</h1>
        <p className="text-muted-foreground text-sm mb-8">Performance analytics and content intelligence.</p>
        <div className="py-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No data yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Generate content using the Content Builder to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Insights</h1>
      <p className="text-muted-foreground text-sm mb-6">Performance analytics and content intelligence.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <Card className="p-5">
          <Layers className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalProjects}</p>
          <p className="text-xs text-muted-foreground">Projects</p>
        </Card>
        <Card className="p-5">
          <FileText className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalListings}</p>
          <p className="text-xs text-muted-foreground">Generated Listings</p>
        </Card>
        <Card className="p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <p className={`text-2xl font-bold ${data.avgQualityScore >= 80 ? "text-green-600" : data.avgQualityScore >= 60 ? "text-yellow-600" : "text-destructive"}`}>
            {data.avgQualityScore}/100
          </p>
          <p className="text-xs text-muted-foreground">Avg Quality Score</p>
        </Card>
        <Card className="p-5">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{data.topIssues.reduce((sum, i) => sum + i.count, 0)}</p>
          <p className="text-xs text-muted-foreground">Total Issues</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Score distribution */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Quality Score Distribution</h3>
          <div className="space-y-3">
            {data.scoreDistribution.map((d) => (
              <div key={d.range} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{d.range}</span>
                <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.range.startsWith("9") ? "bg-green-500" :
                      d.range.startsWith("8") ? "bg-green-400" :
                      d.range.startsWith("6") ? "bg-yellow-500" :
                      "bg-destructive"
                    }`}
                    style={{ width: `${data.totalListings > 0 ? (d.count / data.totalListings) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top issues */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Top Validation Issues</h3>
          {data.topIssues.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">No issues found</span>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{issue.message}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{issue.count}x</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Field completeness */}
        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold mb-4">Content Completeness by Field</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {data.fieldCompleteness.map((f) => (
              <div key={f.field} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{f.field}</span>
                  <span className="text-xs font-medium">{f.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.percentage >= 80 ? "bg-green-500" : f.percentage >= 50 ? "bg-yellow-500" : "bg-destructive"}`}
                    style={{ width: `${f.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
