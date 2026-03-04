import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Check,
  X,
  RotateCcw,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "product_listing", label: "Product Listing", desc: "Title, bullets, description, keywords" },
  { value: "a_plus_content", label: "A+ Content", desc: "Brand story, feature modules, comparison" },
  { value: "seo_description", label: "SEO Description", desc: "Meta tags, long description, keywords" },
  { value: "social_ad", label: "Social Ad Copy", desc: "Headlines, ad text, CTA suggestions" },
];

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`;

export default function ContentGeneration() {
  const { currentWorkspace } = useWorkspace();
  const [contentType, setContentType] = useState("product_listing");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [productFeatures, setProductFeatures] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load profile defaults
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("product_name, product_description, product_features, brand_voice, target_personas, primary_marketplace")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        if (profile.product_name) setProductName(profile.product_name);
        if (profile.product_description) setProductDescription(profile.product_description);
        if (profile.product_features) setProductFeatures(profile.product_features);
        if (profile.brand_voice) setBrandVoice(profile.brand_voice);
        if (profile.target_personas) setTargetAudience(profile.target_personas.join(", "));
        if (profile.primary_marketplace) setMarketplace(profile.primary_marketplace);
      }
    })();
  }, []);

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !productFeatures.includes(trimmed) && productFeatures.length < 10) {
      setProductFeatures([...productFeatures, trimmed]);
      setFeatureInput("");
    }
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name.");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const resp = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          contentType,
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          productFeatures,
          targetAudience: targetAudience.trim(),
          brandVoice,
          marketplace,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        toast.error(err.error || "Generation failed. Please try again.");
        setIsGenerating(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setGeneratedContent(content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setGeneratedContent(content);
            }
          } catch { /* ignore */ }
        }
      }
      // Save to database
      if (content.trim()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: saveErr } = await supabase.from("generated_content").insert({
            user_id: user.id,
            workspace_id: currentWorkspace?.id ?? null,
            content_type: contentType,
            product_name: productName.trim(),
            product_description: productDescription.trim() || null,
            product_features: productFeatures.length > 0 ? productFeatures : null,
            target_audience: targetAudience.trim() || null,
            brand_voice: brandVoice || null,
            marketplace: marketplace || null,
            content: content,
          });
          if (saveErr) console.error("Failed to save content:", saveErr);
          else toast.success("Content saved automatically.");
        }
      }
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current && isGenerating) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedContent, isGenerating]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Input panel */}
      <div className="lg:w-[400px] shrink-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold mb-1">Generate Content</h2>
          <p className="text-sm text-muted-foreground">
            Fill in your product details and let AI create optimized content.
          </p>
        </div>

        {/* Content type */}
        <div className="space-y-2">
          <Label>Content Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  contentType === ct.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className={`text-xs font-medium ${contentType === ct.value ? "text-primary" : ""}`}>
                  {ct.label}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ct.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Product name */}
        <div className="space-y-2">
          <Label htmlFor="pName">Product Name *</Label>
          <Input
            id="pName"
            placeholder="e.g. EcoSmart Water Bottle"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="pDesc">Description</Label>
          <Textarea
            id="pDesc"
            placeholder="Describe your product..."
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Key Features</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add feature, press Enter"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addFeature(); }
              }}
              maxLength={80}
            />
            <Button variant="outline" size="sm" onClick={addFeature}>Add</Button>
          </div>
          {productFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {productFeatures.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 pr-1 text-xs">
                  {f}
                  <button onClick={() => setProductFeatures(productFeatures.filter((x) => x !== f))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Target audience */}
        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            placeholder="e.g. Health-conscious millennials"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !productName.trim()}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Content</>
          )}
        </Button>
      </div>

      {/* Output panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Generated Content</span>
          </div>
          {generatedContent && !isGenerating && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleGenerate} className="gap-1.5 text-xs">
                <RotateCcw className="h-3 w-3" /> Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        <div
          ref={outputRef}
          className="flex-1 rounded-xl border border-border bg-card p-6 overflow-y-auto min-h-[400px]"
        >
          {generatedContent ? (
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
              {generatedContent}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-4 opacity-30" />
              <p className="text-sm">Your AI-generated content will appear here.</p>
              <p className="text-xs mt-1">Fill in your product details and click Generate.</p>
            </div>
          )}
          {isGenerating && (
            <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
