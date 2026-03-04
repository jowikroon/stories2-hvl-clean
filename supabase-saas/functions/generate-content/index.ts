import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  product_listing: `You are an expert e-commerce copywriter. Generate a high-converting product listing with:
- A compelling title (SEO-optimized, under 200 characters)
- 5 bullet points highlighting key features and benefits
- A detailed product description (200-400 words)
- Suggested search keywords

Format with clear markdown headings.`,

  a_plus_content: `You are an expert Amazon A+ Content / Enhanced Brand Content writer. Generate premium content with:
- A brand story section (50-100 words)
- 3 feature highlight modules with headlines and descriptions
- A comparison chart section (if applicable)
- A compelling closing paragraph

Format with clear markdown headings. Use persuasive, benefit-driven language.`,

  seo_description: `You are an SEO specialist for e-commerce marketplaces. Generate:
- An SEO-optimized meta title (under 60 characters)
- A meta description (under 160 characters)
- An SEO-optimized long description (300-500 words)
- A list of 10-15 target keywords with search intent
- Suggested category tags

Format with clear markdown headings.`,

  social_ad: `You are a social media advertising expert. Generate:
- 3 ad headline variations (under 40 characters each)
- 3 primary text variations (under 125 characters each)
- A long-form ad copy (100-150 words)
- Suggested call-to-action options
- Targeting suggestions based on the product

Format with clear markdown headings.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, productName, productDescription, productFeatures, targetAudience, brandVoice, marketplace } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = CONTENT_TYPE_PROMPTS[contentType] || CONTENT_TYPE_PROMPTS.product_listing;

    const userPrompt = `Generate content for the following product:

**Product Name:** ${productName}
**Description:** ${productDescription || "Not provided"}
**Key Features:** ${productFeatures?.length ? productFeatures.join(", ") : "Not provided"}
**Target Audience:** ${targetAudience || "General consumers"}
**Brand Voice:** ${brandVoice || "Professional"}
**Marketplace:** ${marketplace || "Amazon"}

Please generate the content now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
