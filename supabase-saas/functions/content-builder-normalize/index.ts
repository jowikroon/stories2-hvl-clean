import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

interface NormalizeRequest {
  project_id: string;
}

function normalizeEan(ean: string | null | undefined): string | null {
  if (!ean) return null;
  const cleaned = ean.replace(/\D/g, "");
  if (cleaned.length === 13 || cleaned.length === 12 || cleaned.length === 8) {
    return cleaned;
  }
  return null;
}

function normalizeSpecs(specs: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(specs)) {
    if (value === null || value === undefined || value === "") continue;
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    normalized[cleanKey] = String(value).trim();
  }
  return normalized;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { project_id } = (await req.json()) as NormalizeRequest;
    if (!project_id) return errorResponse("project_id is required", 400);

    const supabase = getSupabaseClient(req);

    const { data: inputs, error: fetchError } = await supabase
      .from("product_inputs")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order");

    if (fetchError) return errorResponse(fetchError.message);
    if (!inputs?.length) return errorResponse("No product inputs found", 404);

    const results = [];

    for (const input of inputs) {
      const updates: Record<string, unknown> = {};

      const normalizedEan = normalizeEan(input.ean_gtin);
      if (normalizedEan !== input.ean_gtin) {
        updates.ean_gtin = normalizedEan;
      }

      const normalizedSpecs = normalizeSpecs(input.specs ?? {});
      updates.specs = normalizedSpecs;

      const productName = (input.product_name ?? "").trim();
      if (productName !== input.product_name) {
        updates.product_name = productName;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("product_inputs")
          .update(updates)
          .eq("id", input.id);

        if (updateError) {
          results.push({ id: input.id, sku: input.sku, status: "error", error: updateError.message });
          continue;
        }
      }

      results.push({
        id: input.id,
        sku: input.sku,
        status: "normalized",
        ean_valid: !!normalizedEan,
        spec_count: Object.keys(normalizedSpecs).length,
      });
    }

    await supabase
      .from("content_projects")
      .update({ status: "generating" })
      .eq("id", project_id);

    return jsonResponse({ project_id, normalized: results.length, results });
  } catch (e) {
    console.error("normalize error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error");
  }
});
