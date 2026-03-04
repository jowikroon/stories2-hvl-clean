import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { Search, FileText, CheckCircle2, Clock, Download } from "lucide-react";

interface ListingRow {
  id: string;
  field_type: string;
  content_text: string;
  quality_score: number | null;
  status: string;
  marketplace: string;
  target_country: string;
  version: number;
  created_at: string;
  product_inputs: {
    sku: string;
    product_name: string;
    brand: string | null;
  } | null;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  bullets: "Bullets",
  description: "Description",
  backend_keywords: "Backend Keywords",
  a_plus_brand_story: "A+ Brand Story",
  a_plus_features: "A+ Features",
};

export default function LibraryPage() {
  const { currentWorkspace } = useWorkspace();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadListings();
  }, [currentWorkspace?.id]);

  async function loadListings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("generated_listings")
      .select(`
        id, field_type, content_text, quality_score, status, marketplace, target_country, version, created_at,
        product_inputs!inner(sku, product_name, brand, content_projects!inner(workspace_id))
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      const filtered = (data as unknown as Array<ListingRow & { product_inputs: { content_projects: { workspace_id: string } } & ListingRow["product_inputs"] }>)
        .filter((d) => (d.product_inputs as any)?.content_projects?.workspace_id === currentWorkspace?.id);
      setListings(filtered as unknown as ListingRow[]);
    }
    setLoading(false);
  }

  const filtered = listings.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.content_text.toLowerCase().includes(q) ||
        l.product_inputs?.sku.toLowerCase().includes(q) ||
        l.product_inputs?.product_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: listings.length,
    draft: listings.filter((l) => l.status === "draft").length,
    approved: listings.filter((l) => l.status === "approved").length,
    exported: listings.filter((l) => l.status === "exported").length,
  };

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Content Library</h1>
      <p className="text-muted-foreground text-sm mb-6">Browse all generated marketplace listings with quality scores.</p>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by SKU, product name, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "approved", "exported"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-10 text-center">Loading library...</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No listings found.</p>
          <p className="text-xs text-muted-foreground mt-1">Generate content using the Content Builder to see it here.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Field</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Market</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Version</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{l.product_inputs?.sku ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[180px] truncate">{l.product_inputs?.product_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {FIELD_LABELS[l.field_type] ?? l.field_type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {l.quality_score !== null ? (
                      <span className={`font-medium ${
                        l.quality_score >= 80 ? "text-green-600" :
                        l.quality_score >= 60 ? "text-yellow-600" :
                        "text-destructive"
                      }`}>
                        {l.quality_score}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {l.marketplace} {l.target_country}
                  </td>
                  <td className="px-3 py-2">
                    {l.status === "approved" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    {l.status === "draft" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                    {l.status === "exported" && <Download className="h-3.5 w-3.5 text-primary" />}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">v{l.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
              Showing 100 of {filtered.length} listings
            </p>
          )}
        </div>
      )}
    </div>
  );
}
