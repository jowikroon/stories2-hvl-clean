import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";
import { callLlm } from "../_shared/llm.ts";

interface RepairRequest {
  project_id: string;
  product_input_ids?: string[];
  auto_fix_all?: boolean;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { project_id, product_input_ids, auto_fix_all } = (await req.json()) as RepairRequest;
    if (!project_id) return errorResponse("project_id is required", 400);

    const supabase = getSupabaseClient(req);

    const { data: project, error: projError } = await supabase
      .from("content_projects")
      .select("marketplace, target_country")
      .eq("id", project_id)
      .single();

    if (projError || !project) return errorResponse("Project not found", 404);

    let inputQuery = supabase
      .from("product_inputs")
      .select("id, sku, product_name, brand")
      .eq("project_id", project_id);

    if (product_input_ids?.length) {
      inputQuery = inputQuery.in("id", product_input_ids);
    }

    const { data: inputs, error: inputError } = await inputQuery;
    if (inputError) return errorResponse(inputError.message);

    const results = [];

    for (const input of inputs ?? []) {
      let listingQuery = supabase
        .from("generated_listings")
        .select("*")
        .eq("product_input_id", input.id)
        .eq("version", 1);

      if (!auto_fix_all) {
        listingQuery = listingQuery.not("validation_errors", "eq", "[]");
      }

      const { data: listings } = await listingQuery;

      const repairs = [];

      for (const listing of listings ?? []) {
        const errors = listing.validation_errors as Array<{
          rule_type: string;
          severity: string;
          message: string;
        }>;

        if (!errors?.length) continue;

        const errorSummary = errors
          .map((e) => `- [${e.severity}] ${e.message}`)
          .join("\n");

        const repairPrompt = `Fix the following ${listing.field_type} content to resolve these validation issues:

CURRENT CONTENT:
${listing.content_text}

VALIDATION ISSUES:
${errorSummary}

RULES:
- Fix ALL listed issues
- Keep the same language and tone
- Preserve the core meaning and key information
- For length issues: shorten while keeping the most important keywords
- For forbidden phrases: replace with compliant alternatives
- For byte limits: reduce content length (backend keywords are max 250 bytes)

Return ONLY the fixed content, no explanation.`;

        try {
          const fixed = await callLlm([
            { role: "system", content: "You are a marketplace content compliance expert. Fix content to pass validation rules." },
            { role: "user", content: repairPrompt },
          ], { temperature: 0.3 });

          const newVersion = (listing.version ?? 1) + 1;

          await supabase.from("generated_listings").insert({
            product_input_id: input.id,
            field_type: listing.field_type,
            content_text: fixed.trim(),
            version: newVersion,
            status: "draft",
            marketplace: listing.marketplace,
            target_country: listing.target_country,
            validation_errors: [],
            quality_score: null,
          });

          repairs.push({
            field_type: listing.field_type,
            status: "repaired",
            new_version: newVersion,
            issues_fixed: errors.length,
          });
        } catch (err) {
          repairs.push({
            field_type: listing.field_type,
            status: "error",
            error: err instanceof Error ? err.message : "repair failed",
          });
        }
      }

      results.push({
        product_input_id: input.id,
        sku: input.sku,
        repairs,
      });
    }

    return jsonResponse({ project_id, repaired: results.length, results });
  } catch (e) {
    console.error("repair error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error");
  }
});
