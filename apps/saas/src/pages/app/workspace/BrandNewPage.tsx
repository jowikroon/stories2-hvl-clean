import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

export default function BrandNewPage() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceTone, setVoiceTone] = useState("");
  const [voicePersonality, setVoicePersonality] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Brand name is required");
    if (!currentWorkspace) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data, error } = await supabase.from("brands").insert({
      workspace_id: currentWorkspace.id,
      created_by: user.id,
      name: name.trim(),
      description: description.trim() || null,
      voice_tone: voiceTone.trim() || null,
      voice_personality: voicePersonality.trim() || null,
    }).select("id").single();

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Brand created");
    navigate(`../${data.id}`, { relative: "path" });
  }

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-2">Create Brand</h1>
      <p className="text-muted-foreground mb-8 text-sm">Set up a new brand identity.</p>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Co" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this brand represent?" rows={3} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tone">Voice Tone</Label>
              <Input id="tone" value={voiceTone} onChange={(e) => setVoiceTone(e.target.value)} placeholder="e.g. Professional, Friendly" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personality">Voice Personality</Label>
              <Input id="personality" value={voicePersonality} onChange={(e) => setVoicePersonality(e.target.value)} placeholder="e.g. Witty, Authoritative" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Brand
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
