import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

interface ValidateRequest {
  project_id: string;
  product_input_ids?: string[];
}

interface ValidationRule {
  id: string;
  marketplace: string;
  target_country: string | null;
  field_type: string;
  rule_type: string;
  rule_config: Record<string, unknown>;
  severity: string;
  description: string | null;
}

interface ValidationError {
  rule_id: string;
  rule_type: string;
  severity: string;
  message: string;
  field_type: string;
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

function runRule(text: string, rule: ValidationRule): ValidationError | null {
  switch (rule.rule_type) {
    case "max_chars": {
      const max = (rule.rule_config as { max: number }).max;
      if (text.length > max) {
        return {
          rule_id: rule.id,
          rule_type: rule.rule_type,
          severity: rule.severity,
          message: `${rule.description ?? "Too long"} (${text.length}/${max})`,
          field_type: rule.field_type,
        };
      }
      return null;
    }
    case "max_bytes": {
      const max = (rule.rule_config as { max: number }).max;
      const bytes = getByteLength(text);
      if (bytes > max) {
        return {
          rule_id: rule.id,
          rule_type: rule.rule_type,
          severity: rule.severity,
          message: `${rule.description ?? "Exceeds byte limit"} (${bytes}/${max} bytes)`,
          field_type: rule.field_type,
        };
      }
      return null;
    }
    case "forbidden_phrases": {
      const phrases = (rule.rule_config as { phrases: string[] }).phrases ?? [];
      const lower = text.toLowerCase();
      const found = phrases.filter((p) => lower.includes(p.toLowerCase()));
      if (found.length > 0) {
        return {
          rule_id: rule.id,
          rule_type: rule.rule_type,
          severity: rule.severity,
          message: `${rule.description ?? "Forbidden phrases"}: "${found.join('", "')}"`,
          field_type: rule.field_type,
        };
      }
      return null;
    }
    default:
      return null;
  }
}

function calculateQualityScore(
  fieldErrors: ValidationError[],
  fieldCount: number,
  totalTextLength: number
): number {
  const errorCount = fieldErrors.filter((e) => e.severity === "error").length;
  const warningCount = fieldErrors.filter((e) => e.severity === "warning").length;

  let score = 100;
  score -= errorCount * 20;
  score -= warningCount * 8;

  if (fieldCount < 4) score -= (4 - fieldCount) * 10;
  if (totalTextLength < 200) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { project_id, product_input_ids } = (await req.json()) as ValidateRequest;
    if (!project_id) return errorResponse("project_id is required", 400);

    const supabase = getSupabaseClient(req);

    const { data: project, error: projError } = await supabase
      .from("content_projects")
      .select("marketplace, target_country")
      .eq("id", project_id)
      .single();

    if (projError || !project) return errorResponse("Project not found", 404);

    const { data: rules, error: rulesError } = await supabase
      .from("validation_rules")
      .select("*")
      .eq("marketplace", project.marketplace)
      .eq("active", true);

    if (rulesError) return errorResponse(rulesError.message);

    const applicableRules = (rules ?? []).filter(
      (r: ValidationRule) => r.target_country === null || r.target_country === project.target_country
    );

    let query = supabase
      .from("product_inputs")
      .select("id, sku")
      .eq("project_id", project_id);

    if (product_input_ids?.length) {
      query = query.in("id", product_input_ids);
    }

    const { data: inputs, error: inputError } = await query;
    if (inputError) return errorResponse(inputError.message);

    const results = [];

    for (const input of inputs ?? []) {
      const { data: listings } = await supabase
        .from("generated_listings")
        .select("id, field_type, content_text")
        .eq("product_input_id", input.id)
        .eq("version", 1);

      const allErrors: ValidationError[] = [];
      let totalTextLength = 0;

      for (const listing of listings ?? []) {
        const text = listing.content_text ?? "";
        totalTextLength += text.length;
        const fieldRules = applicableRules.filter((r: ValidationRule) => r.field_type === listing.field_type);

        for (const rule of fieldRules) {
          const error = runRule(text, rule);
          if (error) allErrors.push(error);
        }

        const qualityScore = calculateQualityScore(
          allErrors.filter((e) => e.field_type === listing.field_type),
          1,
          text.length
        );

        await supabase
          .from("generated_listings")
          .update({
            validation_errors: allErrors.filter((e) => e.field_type === listing.field_type),
            quality_score: qualityScore,
          })
          .eq("id", listing.id);
      }

      const overallScore = calculateQualityScore(allErrors, listings?.length ?? 0, totalTextLength);

      results.push({
        product_input_id: input.id,
        sku: input.sku,
        quality_score: overallScore,
        error_count: allErrors.filter((e) => e.severity === "error").length,
        warning_count: allErrors.filter((e) => e.severity === "warning").length,
        errors: allErrors,
      });
    }

    return jsonResponse({ project_id, validated: results.length, results });
  } catch (e) {
    console.error("validate error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error");
  }
});
