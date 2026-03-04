import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  voice_tone: string | null;
  voice_personality: string | null;
  voice_language: string | null;
  voice_keywords: string[] | null;
  voice_examples: string | null;
  rules_dos: string[] | null;
  rules_donts: string[] | null;
  rules_grammar_notes: string | null;
  templates: TemplateItem[];
}

interface TemplateItem {
  id: string;
  name: string;
  content: string;
}

export default function BrandDetailPage() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceTone, setVoiceTone] = useState("");
  const [voicePersonality, setVoicePersonality] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("en");
  const [voiceKeywords, setVoiceKeywords] = useState<string[]>([]);
  const [voiceExamples, setVoiceExamples] = useState("");
  const [rulesDos, setRulesDos] = useState<string[]>([]);
  const [rulesDonts, setRulesDonts] = useState<string[]>([]);
  const [rulesGrammar, setRulesGrammar] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  async function loadBrand() {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId!)
      .single();
    if (error || !data) {
      toast.error("Brand not found");
      setLoading(false);
      return;
    }
    const b = data as any;
    setBrand(b);
    setName(b.name);
    setDescription(b.description ?? "");
    setVoiceTone(b.voice_tone ?? "");
    setVoicePersonality(b.voice_personality ?? "");
    setVoiceLanguage(b.voice_language ?? "en");
    setVoiceKeywords(b.voice_keywords ?? []);
    setVoiceExamples(b.voice_examples ?? "");
    setRulesDos(b.rules_dos ?? []);
    setRulesDonts(b.rules_donts ?? []);
    setRulesGrammar(b.rules_grammar_notes ?? "");
    setTemplates(Array.isArray(b.templates) ? b.templates : []);
    setLoading(false);
  }

  async function save() {
    if (!brandId) return;
    setSaving(true);
    const { error } = await supabase.from("brands").update({
      name, description: description || null,
      voice_tone: voiceTone || null, voice_personality: voicePersonality || null,
      voice_language: voiceLanguage || "en", voice_keywords: voiceKeywords.length ? voiceKeywords : null,
      voice_examples: voiceExamples || null,
      rules_dos: rulesDos.length ? rulesDos : null, rules_donts: rulesDonts.length ? rulesDonts : null,
      rules_grammar_notes: rulesGrammar || null,
      templates: templates as any,
    }).eq("id", brandId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Brand saved");
  }

  async function deleteBrand() {
    if (!brandId) return;
    const { error } = await supabase.from("brands").delete().eq("id", brandId);
    if (error) return toast.error(error.message);
    toast.success("Brand deleted");
    navigate("..", { relative: "path" });
  }

  // List helpers
  function addToList(list: string[], setList: (v: string[]) => void, value: string) {
    if (value.trim()) setList([...list, value.trim()]);
  }
  function removeFromList(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  // Template helpers
  function addTemplate() {
    setTemplates([...templates, { id: crypto.randomUUID(), name: "", content: "" }]);
  }
  function updateTemplate(id: string, field: "name" | "content", value: string) {
    setTemplates(templates.map((t) => t.id === id ? { ...t, [field]: value } : t));
  }
  function removeTemplate(id: string) {
    setTemplates(templates.filter((t) => t.id !== id));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!brand) return <p className="text-muted-foreground py-12 text-center">Brand not found.</p>;

  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          {brand.description && <p className="text-muted-foreground text-sm mt-1">{brand.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteBrand} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card className="p-6 mt-4 space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </Card>
        </TabsContent>

        {/* Voice */}
        <TabsContent value="voice">
          <Card className="p-6 mt-4 space-y-5 max-w-2xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Input value={voiceTone} onChange={(e) => setVoiceTone(e.target.value)} placeholder="e.g. Professional, Friendly" />
              </div>
              <div className="space-y-2">
                <Label>Personality</Label>
                <Input value={voicePersonality} onChange={(e) => setVoicePersonality(e.target.value)} placeholder="e.g. Witty, Authoritative" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} placeholder="en" />
            </div>
            <div className="space-y-2">
              <Label>Keywords</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {voiceKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {kw}
                    <button onClick={() => removeFromList(voiceKeywords, setVoiceKeywords, i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Add keyword" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList(voiceKeywords, setVoiceKeywords, newKeyword); setNewKeyword(""); }}} />
                <Button type="button" variant="outline" size="sm" onClick={() => { addToList(voiceKeywords, setVoiceKeywords, newKeyword); setNewKeyword(""); }}>Add</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Voice Examples</Label>
              <Textarea value={voiceExamples} onChange={(e) => setVoiceExamples(e.target.value)} placeholder="Paste example copy that matches this brand voice..." rows={4} />
            </div>
          </Card>
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules">
          <Card className="p-6 mt-4 space-y-5 max-w-2xl">
            <ListEditor label="Do's" items={rulesDos} setItems={setRulesDos} placeholder="e.g. Always use active voice" />
            <ListEditor label="Don'ts" items={rulesDonts} setItems={setRulesDonts} placeholder="e.g. Never use jargon" />
            <div className="space-y-2">
              <Label>Grammar &amp; Style Notes</Label>
              <Textarea value={rulesGrammar} onChange={(e) => setRulesGrammar(e.target.value)} placeholder="Additional grammar or style notes..." rows={4} />
            </div>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <div className="mt-4 space-y-4 max-w-2xl">
            {templates.map((t) => (
              <Card key={t.id} className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Input value={t.name} onChange={(e) => updateTemplate(t.id, "name", e.target.value)} placeholder="Template name" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeTemplate(t.id)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea value={t.content} onChange={(e) => updateTemplate(t.id, "content", e.target.value)} placeholder="Template content / prompt..." rows={4} />
              </Card>
            ))}
            <Button variant="outline" onClick={addTemplate} className="gap-2"><Plus className="h-4 w-4" /> Add Template</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable list editor for do's / don'ts
function ListEditor({ label, items, setItems, placeholder }: { label: string; items: string[]; setItems: (v: string[]) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{item}</span>
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (val.trim()) { setItems([...items, val.trim()]); setVal(""); }}}} />
        <Button type="button" variant="outline" size="sm" onClick={() => { if (val.trim()) { setItems([...items, val.trim()]); setVal(""); }}}>Add</Button>
      </div>
    </div>
  );
}
