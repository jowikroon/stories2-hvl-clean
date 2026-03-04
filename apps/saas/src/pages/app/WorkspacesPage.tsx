import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Building2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WorkspacesPage() {
  const { workspaces, createWorkspace, loading } = useWorkspace();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace(newName.trim());
      toast.success(`Workspace "${ws.name}" created`);
      setNewName("");
      navigate(`/app/workspace/${ws.id}/overview`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Workspaces</h1>
      <p className="text-muted-foreground mb-8">Manage your workspaces or create a new one.</p>

      <div className="flex gap-3 mb-8">
        <Input
          placeholder="New workspace name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Create
        </Button>
      </div>

      <div className="space-y-3">
        {workspaces.map((ws) => (
          <Card
            key={ws.id}
            className="p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate(`/app/workspace/${ws.id}/overview`)}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{ws.name}</h3>
              <p className="text-xs text-muted-foreground">
                Created {new Date(ws.created_at).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
        {workspaces.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No workspaces yet. Create your first one above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
