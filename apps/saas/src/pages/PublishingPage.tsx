import { useState, useEffect } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Inbox,
} from "lucide-react";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  product_listing: "Product Listing",
  a_plus_content: "A+ Content",
  seo_description: "SEO Description",
  social_ad: "Social Ad Copy",
};

const MARKETPLACES = [
  { value: "amazon", label: "Amazon" },
  { value: "bol_com", label: "Bol.com" },
  { value: "shopify", label: "Shopify" },
  { value: "etsy", label: "Etsy" },
  { value: "ebay", label: "eBay" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
  draft: { label: "Draft", variant: "outline", icon: FileText },
  scheduled: { label: "Scheduled", variant: "secondary", icon: Clock },
  published: { label: "Published", variant: "default", icon: CheckCircle2 },
};

type ContentItem = {
  id: string;
  content_type: string;
  product_name: string;
  content: string;
  marketplace: string | null;
  created_at: string;
};

type Publication = {
  id: string;
  content_id: string;
  marketplace: string;
  status: string;
  published_at: string | null;
  created_at: string;
};

export default function PublishingPage() {
  const { currentWorkspace } = useWorkspace();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishMarketplace, setPublishMarketplace] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (currentWorkspace) loadData();
  }, [currentWorkspace]);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentWorkspace) return;

    const [contentRes, pubRes] = await Promise.all([
      supabase
        .from("generated_content")
        .select("id, content_type, product_name, content, marketplace, created_at")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("publications")
        .select("id, content_id, marketplace, status, published_at, created_at")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false }),
    ]);

    if (contentRes.data) setContent(contentRes.data);
    if (pubRes.data) setPublications(pubRes.data);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedIds.size === 0 || !publishMarketplace) {
      toast.error("Select content and a marketplace.");
      return;
    }

    setPublishing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = Array.from(selectedIds).map((content_id) => ({
      user_id: user.id,
      workspace_id: currentWorkspace?.id ?? null,
      content_id,
      marketplace: publishMarketplace,
      status: "published",
      published_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("publications").insert(rows);
    if (error) {
      toast.error("Failed to publish. Please try again.");
      console.error(error);
    } else {
      toast.success(`Published ${rows.length} item(s) to ${MARKETPLACES.find(m => m.value === publishMarketplace)?.label}.`);
      setSelectedIds(new Set());
      setPublishMarketplace("");
      await loadData();
    }
    setPublishing(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("generated_content").delete().eq("id", id);
    if (error) toast.error("Delete failed.");
    else {
      toast.success("Content deleted.");
      setContent((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getPublicationsForContent = (contentId: string) =>
    publications.filter((p) => p.content_id === contentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Publishing</h2>
        <p className="text-sm text-muted-foreground">
          Select generated content and publish to your marketplaces.
        </p>
      </div>

      {/* Publish action bar */}
      {content.length > 0 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
            <span className="text-sm font-medium shrink-0">
              {selectedIds.size} selected
            </span>
            <Select value={publishMarketplace} onValueChange={setPublishMarketplace}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handlePublish}
              disabled={selectedIds.size === 0 || !publishMarketplace || publishing}
              className="gap-2 w-full sm:w-auto"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish Selected
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content list */}
      {content.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-muted-foreground">
          <Inbox className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm font-medium">No generated content yet.</p>
          <p className="text-xs mt-1">
            Go to Content to generate product listings first.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const pubs = getPublicationsForContent(item.id);

            return (
              <Card
                key={item.id}
                className={`transition-colors cursor-pointer ${
                  isSelected ? "border-primary ring-1 ring-primary" : ""
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {item.product_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                          </Badge>
                          <span className="text-xs">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap mb-3">
                    {item.content.slice(0, 300)}
                    {item.content.length > 300 && "…"}
                  </p>

                  {pubs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pubs.map((pub) => {
                        const cfg = STATUS_CONFIG[pub.status] || STATUS_CONFIG.draft;
                        const Icon = cfg.icon;
                        return (
                          <Badge
                            key={pub.id}
                            variant={cfg.variant}
                            className="gap-1 text-[10px]"
                          >
                            <Icon className="h-3 w-3" />
                            {MARKETPLACES.find(m => m.value === pub.marketplace)?.label || pub.marketplace}
                            {" · "}
                            {cfg.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
