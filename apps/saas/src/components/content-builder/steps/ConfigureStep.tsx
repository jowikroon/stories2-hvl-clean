import { useState, useEffect } from "react";
import { Settings2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import type { ProductInput, ContentProject } from "@/lib/content-builder/types";

interface ConfigureStepProps {
  products: ProductInput[];
  project: ContentProject | null;
  onProjectChange: (project: ContentProject) => void;
  onComplete: () => void;
  onBack: () => void;
}

const MARKETPLACES = [
  { value: "amazon", label: "Amazon", countries: ["DE", "NL", "FR", "ES", "IT"] },
  { value: "bol", label: "Bol.com", countries: ["NL", "BE"] },
  { value: "ebay", label: "eBay", countries: ["DE", "NL"] },
];

const TONES = [
  { value: "professional", label: "Professional", desc: "Clear, authoritative, spec-focused" },
  { value: "premium", label: "Premium", desc: "Luxury feel, heritage, craftsmanship" },
  { value: "technical", label: "Technical", desc: "Detailed specs, engineering-focused" },
  { value: "friendly", label: "Friendly", desc: "Approachable, benefit-first, conversational" },
];

export default function ConfigureStep({ products, project, onProjectChange, onComplete, onBack }: ConfigureStepProps) {
  const { currentWorkspace } = useWorkspace();
  const [name, setName] = useState(project?.name ?? "");
  const [marketplace, setMarketplace] = useState(project?.marketplace ?? "amazon");
  const [country, setCountry] = useState(project?.target_country ?? "DE");
  const [tone, setTone] = useState(project?.tone_of_voice ?? "professional");
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [brandId, setBrandId] = useState(project?.brand_id ?? "");
  const [saving, setSaving] = useState(false);

  const selectedMarketplace = MARKETPLACES.find((m) => m.value === marketplace);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    supabase
      .from("brands")
      .select("id, name")
      .eq("workspace_id", currentWorkspace.id)
      .then(({ data }) => {
        if (data) setBrands(data);
      });
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (selectedMarketplace && !selectedMarketplace.countries.includes(country)) {
      setCountry(selectedMarketplace.countries[0]);
    }
  }, [marketplace]);

  const handleContinue = async () => {
    if (!currentWorkspace?.id) return;
    setSaving(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const projectData = {
        name: name.trim() || `Content ${new Date().toLocaleDateString()}`,
        brand_id: brandId || null,
        marketplace,
        target_country: country,
        tone_of_voice: tone,
        workspace_id: currentWorkspace.id,
        created_by: user.user.id,
        status: "draft" as const,
      };

      if (project?.id) {
        const { data, error } = await supabase
          .from("content_projects")
          .update(projectData)
          .eq("id", project.id)
          .select()
          .single();

        if (error) throw error;
        onProjectChange(data as unknown as ContentProject);
      } else {
        const { data, error } = await supabase
          .from("content_projects")
          .insert(projectData)
          .select()
          .single();

        if (error) throw error;
        const newProject = data as unknown as ContentProject;

        const inputRows = products.map((p, i) => ({
          project_id: newProject.id,
          sku: p.sku,
          ean_gtin: p.ean_gtin ?? null,
          brand: p.brand ?? null,
          product_name: p.product_name,
          specs: p.specs,
          category_hint: p.category_hint ?? null,
          images: p.images,
          certifications: p.certifications,
          sort_order: i,
        }));

        const { error: inputError } = await supabase
          .from("product_inputs")
          .insert(inputRows);

        if (inputError) throw inputError;
        onProjectChange(newProject);
      }

      onComplete();
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configure Generation</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Set the marketplace, country, and content style for {products.length} product{products.length !== 1 ? "s" : ""}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project name */}
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input
            placeholder="e.g. ABS Brake Discs DE Launch"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="space-y-2">
            <Label>Brand Voice</Label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No brand preset</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Marketplace */}
      <div className="space-y-3">
        <Label>Marketplace</Label>
        <div className="grid grid-cols-3 gap-3">
          {MARKETPLACES.map((mp) => (
            <button
              key={mp.value}
              onClick={() => setMarketplace(mp.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                marketplace === mp.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className={`text-sm font-medium ${marketplace === mp.value ? "text-primary" : ""}`}>
                {mp.label}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {mp.countries.join(", ")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Country */}
      <div className="space-y-3">
        <Label>Target Country</Label>
        <div className="flex flex-wrap gap-2">
          {selectedMarketplace?.countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                country === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-3">
        <Label>Content Tone</Label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                tone === t.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className={`text-xs font-medium ${tone === t.value ? "text-primary" : ""}`}>
                {t.label}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleContinue} disabled={saving} size="lg" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {saving ? "Saving..." : "Start Generation"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
