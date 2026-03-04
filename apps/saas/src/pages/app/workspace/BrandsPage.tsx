import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  voice_tone: string | null;
  created_at: string;
}

export default function BrandsPage() {
  const { currentWorkspace } = useWorkspace();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) loadBrands();
  }, [currentWorkspace]);

  async function loadBrands() {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, description, voice_tone, created_at")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setBrands(data ?? []);
    setLoading(false);
  }

  async function deleteBrand(id: string) {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast.success("Brand deleted");
    }
  }

  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Brands</h1>
          <p className="text-muted-foreground text-sm">Manage your brand identities and voice profiles.</p>
        </div>
        <Link to="new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Brand</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : brands.length === 0 ? (
        <Card className="p-12 flex flex-col items-center gap-4 text-center">
          <Tag className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No brands yet. Create your first brand to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Card key={b.id} className="p-5 flex flex-col gap-3 group relative">
              <div className="flex items-start justify-between">
                <Link to={b.id} className="font-semibold text-lg hover:underline">{b.name}</Link>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => deleteBrand(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {b.description && <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>}
              <div className="flex items-center gap-2 mt-auto">
                {b.voice_tone && <Badge variant="secondary">{b.voice_tone}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(b.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
