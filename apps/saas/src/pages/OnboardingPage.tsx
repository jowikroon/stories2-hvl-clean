import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Package,
  Users,
  Megaphone,
  Target,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { icon: Package, label: "Product", title: "Tell us about your product" },
  { icon: Users, label: "Audience", title: "Define your target audience" },
  { icon: Megaphone, label: "Voice", title: "Set your brand voice" },
  { icon: Target, label: "Goals", title: "Choose your desired outcomes" },
];

const CATEGORIES = [
  "Electronics",
  "Fashion & Apparel",
  "Home & Garden",
  "Health & Beauty",
  "Sports & Outdoors",
  "Toys & Games",
  "Food & Beverage",
  "Books & Media",
  "Automotive",
  "Other",
];

const VOICE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Authoritative, trustworthy, polished" },
  { value: "casual", label: "Casual", desc: "Friendly, approachable, conversational" },
  { value: "luxury", label: "Luxury", desc: "Elegant, refined, exclusive" },
  { value: "playful", label: "Playful", desc: "Fun, energetic, youthful" },
  { value: "technical", label: "Technical", desc: "Precise, detailed, expert-level" },
  { value: "bold", label: "Bold", desc: "Confident, direct, impactful" },
];

const TONE_KEYWORDS = [
  "Trustworthy", "Innovative", "Eco-friendly", "Premium", "Value-driven",
  "Minimalist", "Adventurous", "Caring", "Empowering", "Authentic",
];

const OUTCOME_OPTIONS = [
  { value: "increase_conversion", label: "Increase Conversions", desc: "Optimize listings for higher sales" },
  { value: "improve_seo", label: "Improve SEO", desc: "Rank higher in marketplace search" },
  { value: "expand_markets", label: "Expand Markets", desc: "Reach new marketplaces and regions" },
  { value: "brand_consistency", label: "Brand Consistency", desc: "Unified messaging across platforms" },
  { value: "save_time", label: "Save Time", desc: "Automate content creation workflows" },
  { value: "ab_testing", label: "A/B Testing", desc: "Data-driven content optimization" },
];

const MARKETPLACE_OPTIONS = [
  { value: "amazon", label: "Amazon" },
  { value: "bolcom", label: "Bol.com" },
  { value: "both", label: "Both" },
  { value: "other", label: "Other / Custom" },
];

const MARKET_OPTIONS = [
  "Netherlands", "Germany", "Belgium", "France", "UK", "USA", "Spain", "Italy",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Product
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [productFeatures, setProductFeatures] = useState<string[]>([]);

  // Step 2: Audience
  const [personaInput, setPersonaInput] = useState("");
  const [targetPersonas, setTargetPersonas] = useState<string[]>([]);
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);

  // Step 3: Voice
  const [brandVoice, setBrandVoice] = useState("");
  const [brandToneKeywords, setBrandToneKeywords] = useState<string[]>([]);
  const [brandLanguage, setBrandLanguage] = useState("en");

  // Step 4: Outcomes
  const [desiredOutcomes, setDesiredOutcomes] = useState<string[]>([]);
  const [primaryMarketplace, setPrimaryMarketplace] = useState("");

  const addTag = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter?: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed) && list.length < 10) {
      setter([...list, trimmed]);
      inputSetter?.("");
    }
  };

  const removeTag = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(list.filter((item) => item !== value));
  };

  const toggleSelection = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    max = 6
  ) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else if (list.length < max) {
      setter([...list, value]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return productName.trim().length > 0;
      case 1: return true; // audience is optional
      case 2: return brandVoice.length > 0;
      case 3: return desiredOutcomes.length > 0 && primaryMarketplace.length > 0;
      default: return false;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        product_name: productName.trim(),
        product_description: productDescription.trim() || null,
        product_features: productFeatures.length > 0 ? productFeatures : null,
        product_category: productCategory || null,
        target_personas: targetPersonas.length > 0 ? targetPersonas : null,
        target_age_range: targetAgeRange || null,
        target_markets: targetMarkets.length > 0 ? targetMarkets : null,
        brand_voice: brandVoice,
        brand_tone_keywords: brandToneKeywords.length > 0 ? brandToneKeywords : null,
        brand_language: brandLanguage,
        desired_outcomes: desiredOutcomes,
        primary_marketplace: primaryMarketplace,
        onboarding_completed: true,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast.success("Setup complete! Welcome aboard.");
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6">
        <span className="text-sm font-bold tracking-tight">
          marketplace<span className="text-gradient">growth</span>.nl
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                      ? "bg-primary/20 text-primary cursor-pointer"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${i < step ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl font-bold mb-2">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground mb-8">
                {step === 0 && "Enter your product details so our AI can generate tailored content."}
                {step === 1 && "Help us understand who you're selling to."}
                {step === 2 && "Define how your brand should sound across all content."}
                {step === 3 && "Tell us what success looks like for you."}
              </p>

              {/* Step 0: Product */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g. EcoSmart Water Bottle"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDesc">Description</Label>
                    <Textarea
                      id="productDesc"
                      placeholder="Briefly describe your product, its unique selling points, and key benefits..."
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      maxLength={1000}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setProductCategory(productCategory === cat ? "" : cat)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            productCategory === cat
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Features</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a feature and press Enter"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(featureInput, productFeatures, setProductFeatures, setFeatureInput);
                          }
                        }}
                        maxLength={80}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTag(featureInput, productFeatures, setProductFeatures, setFeatureInput)}
                      >
                        Add
                      </Button>
                    </div>
                    {productFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productFeatures.map((f) => (
                          <Badge key={f} variant="secondary" className="gap-1 pr-1">
                            {f}
                            <button onClick={() => removeTag(f, productFeatures, setProductFeatures)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Audience */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Target Personas</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Health-conscious millennials"
                        value={personaInput}
                        onChange={(e) => setPersonaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(personaInput, targetPersonas, setTargetPersonas, setPersonaInput);
                          }
                        }}
                        maxLength={80}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTag(personaInput, targetPersonas, setTargetPersonas, setPersonaInput)}
                      >
                        Add
                      </Button>
                    </div>
                    {targetPersonas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {targetPersonas.map((p) => (
                          <Badge key={p} variant="secondary" className="gap-1 pr-1">
                            {p}
                            <button onClick={() => removeTag(p, targetPersonas, setTargetPersonas)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Input
                      id="ageRange"
                      placeholder="e.g. 25-45"
                      value={targetAgeRange}
                      onChange={(e) => setTargetAgeRange(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Markets</Label>
                    <div className="flex flex-wrap gap-2">
                      {MARKET_OPTIONS.map((market) => (
                        <button
                          key={market}
                          onClick={() => toggleSelection(market, targetMarkets, setTargetMarkets, 8)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            targetMarkets.includes(market)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {market}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Brand Voice */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Brand Voice *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {VOICE_OPTIONS.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => setBrandVoice(v.value)}
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            brandVoice === v.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className={`text-sm font-medium ${brandVoice === v.value ? "text-primary" : ""}`}>
                            {v.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{v.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone Keywords</Label>
                    <div className="flex flex-wrap gap-2">
                      {TONE_KEYWORDS.map((kw) => (
                        <button
                          key={kw}
                          onClick={() => toggleSelection(kw, brandToneKeywords, setBrandToneKeywords, 5)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            brandToneKeywords.includes(kw)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select up to 5 keywords</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Primary Content Language</Label>
                    <select
                      id="language"
                      value={brandLanguage}
                      onChange={(e) => setBrandLanguage(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                    >
                      <option value="en">English</option>
                      <option value="nl">Dutch</option>
                      <option value="de">German</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Desired Outcomes */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>What do you want to achieve? *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {OUTCOME_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => toggleSelection(o.value, desiredOutcomes, setDesiredOutcomes)}
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            desiredOutcomes.includes(o.value)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className={`text-sm font-medium ${desiredOutcomes.includes(o.value) ? "text-primary" : ""}`}>
                            {o.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Marketplace *</Label>
                    <div className="flex flex-wrap gap-3">
                      {MARKETPLACE_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setPrimaryMarketplace(m.value)}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            primaryMarketplace === m.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || saving}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Finish Setup <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
