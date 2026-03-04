import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";
import { callLlm } from "../_shared/llm.ts";

interface GenerateRequest {
  project_id: string;
  product_input_ids?: string[];
}

const FIELD_PROMPTS: Record<string, string> = {
  title: `Generate an Amazon product title for the following product.
Rules:
- Under 200 characters
- Format: Brand + Product Type + Key Feature + Size/Variant (if applicable)
- Include the most important search keywords naturally
- Do NOT use superlatives like "best", "#1", or "top rated"
- Do NOT use ALL CAPS (except brand names/acronyms)
Return ONLY the title text, no quotes or explanation.`,

  bullets: `Generate exactly 5 Amazon bullet points for the following product.
Rules:
- Each bullet starts with a CAPITALIZED benefit keyword (2-3 words)
- Follow with a concise explanation of the feature/benefit
- Include relevant specs and measurements where applicable
- Each bullet under 200 characters for readability
- Focus on: (1) primary benefit, (2) quality/material, (3) compatibility/fitment, (4) ease of use, (5) trust/certification
- Do NOT use medical claims, guarantees, or superlatives
Return ONLY the 5 bullets, one per line, no numbering or bullet characters.`,

  description: `Generate an Amazon product description for the following product.
Rules:
- 150-300 words
- Benefit-driven opening paragraph
- Technical specifications paragraph
- Compatibility/fitment paragraph (if applicable)
- Closing with trust signals (certifications, warranty, brand heritage)
- Plain text, no HTML
- Do NOT use forbidden claims or superlatives
Return ONLY the description text.`,

  backend_keywords: `Generate Amazon backend search terms for the following product.
Rules:
- Maximum 250 bytes total
- Space-separated words (no commas, no semicolons)
- Do NOT repeat words already in the title or bullets
- Include: synonyms, alternate spellings, related terms, common misspellings
- Do NOT include: brand names, ASINs, "best", "cheapest", subjective terms
- Lowercase only
Return ONLY the keyword string, no explanation.`,

  a_plus_brand_story: `Generate an A+ Content brand story section for the following product/brand.
Rules:
- 50-100 words
- Focus on brand heritage, values, and quality commitment
- Mention certifications or manufacturing origin if relevant
- Warm, authoritative tone
Return ONLY the brand story text.`,

  a_plus_features: `Generate 3 A+ Content feature highlight modules for the following product.
Rules:
- Each module: headline (under 50 chars) + description (50-80 words)
- Focus on visual/tangible benefits
- Separate modules with ---
Return ONLY the 3 modules in format:
HEADLINE
Description text

---

HEADLINE
Description text

---

HEADLINE
Description text`,
};

const COUNTRY_LANGUAGE: Record<string, string> = {
  DE: "German",
  FR: "French",
  ES: "Spanish",
  IT: "Italian",
  NL: "Dutch",
  BE: "Dutch",
  US: "English",
  UK: "English",
};

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { project_id, product_input_ids } = (await req.json()) as GenerateRequest;
    if (!project_id) return errorResponse("project_id is required", 400);

    const supabase = getSupabaseClient(req);

    const { data: project, error: projError } = await supabase
      .from("content_projects")
      .select("*, brands(*)")
      .eq("id", project_id)
      .single();

    if (projError || !project) return errorResponse("Project not found", 404);

    let query = supabase
      .from("product_inputs")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order");

    if (product_input_ids?.length) {
      query = query.in("id", product_input_ids);
    }

    const { data: inputs, error: inputError } = await query;
    if (inputError) return errorResponse(inputError.message);
    if (!inputs?.length) return errorResponse("No product inputs found", 404);

    const language = COUNTRY_LANGUAGE[project.target_country] ?? "English";
    const brandVoice = project.brands?.voice_personality ?? project.tone_of_voice ?? "professional";

    const results = [];

    for (const input of inputs) {
      const productContext = buildProductContext(input, project, language, brandVoice);
      const generated: Record<string, string> = {};

      for (const [fieldType, systemPrompt] of Object.entries(FIELD_PROMPTS)) {
        try {
          const content = await callLlm([
            { role: "system", content: systemPrompt + `\n\nIMPORTANT: Write in ${language}. Brand voice: ${brandVoice}.` },
            { role: "user", content: productContext },
          ], { temperature: 0.6 });

          generated[fieldType] = content.trim();

          await supabase.from("generated_listings").upsert({
            product_input_id: input.id,
            field_type: fieldType,
            content_text: content.trim(),
            version: 1,
            status: "draft",
            marketplace: project.marketplace,
            target_country: project.target_country,
          }, {
            onConflict: "product_input_id,field_type,version",
          });
        } catch (err) {
          console.error(`Generation failed for ${input.sku}/${fieldType}:`, err);
          generated[fieldType] = `[ERROR: ${err instanceof Error ? err.message : "generation failed"}]`;
        }
      }

      results.push({
        id: input.id,
        sku: input.sku,
        fields_generated: Object.keys(generated).filter((k) => !generated[k].startsWith("[ERROR")),
        errors: Object.entries(generated)
          .filter(([, v]) => v.startsWith("[ERROR"))
          .map(([k]) => k),
      });
    }

    await supabase
      .from("content_projects")
      .update({ status: "review" })
      .eq("id", project_id);

    return jsonResponse({ project_id, generated: results.length, results });
  } catch (e) {
    console.error("generate error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error");
  }
});

function buildProductContext(
  input: Record<string, unknown>,
  project: Record<string, unknown>,
  language: string,
  brandVoice: string
): string {
  const specs = input.specs as Record<string, string> ?? {};
  const specLines = Object.entries(specs)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `Product: ${input.product_name}
Brand: ${input.brand ?? "Unknown"}
SKU: ${input.sku}
EAN/GTIN: ${input.ean_gtin ?? "N/A"}
Category: ${input.category_hint ?? "General"}
Marketplace: ${project.marketplace} ${(project as Record<string, unknown>).target_country}
Language: ${language}
Brand voice: ${brandVoice}

Specifications:
${specLines || "No specifications provided"}

Certifications: ${(input.certifications as string[] ?? []).join(", ") || "None specified"}`;
}
