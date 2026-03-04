import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

interface ExportRequest {
  project_id: string;
  format?: "amazon_flatfile_csv" | "sp_api_json" | "copy_pack_pdf";
}

const AMAZON_FLATFILE_HEADERS = [
  "sku",
  "product_name",
  "brand",
  "ean_gtin",
  "item_name",
  "bullet_point1",
  "bullet_point2",
  "bullet_point3",
  "bullet_point4",
  "bullet_point5",
  "product_description",
  "generic_keywords",
  "quality_score",
];

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { project_id, format = "amazon_flatfile_csv" } = (await req.json()) as ExportRequest;
    if (!project_id) return errorResponse("project_id is required", 400);

    const supabase = getSupabaseClient(req);

    const { data: project, error: projError } = await supabase
      .from("content_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projError || !project) return errorResponse("Project not found", 404);

    const { data: inputs, error: inputError } = await supabase
      .from("product_inputs")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order");

    if (inputError) return errorResponse(inputError.message);

    const rows = [];

    for (const input of inputs ?? []) {
      const { data: listings } = await supabase
        .from("generated_listings")
        .select("field_type, content_text, quality_score, version")
        .eq("product_input_id", input.id)
        .order("version", { ascending: false });

      const latestByField: Record<string, { content_text: string; quality_score: number | null }> = {};
      for (const listing of listings ?? []) {
        if (!latestByField[listing.field_type]) {
          latestByField[listing.field_type] = listing;
        }
      }

      const title = latestByField["title"]?.content_text ?? "";
      const bulletsRaw = latestByField["bullets"]?.content_text ?? "";
      const bullets = bulletsRaw.split("\n").filter((b: string) => b.trim().length > 0);
      const description = latestByField["description"]?.content_text ?? "";
      const backendKeywords = latestByField["backend_keywords"]?.content_text ?? "";

      const scores = Object.values(latestByField)
        .map((l) => l.quality_score)
        .filter((s): s is number => s !== null);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      if (format === "amazon_flatfile_csv") {
        rows.push({
          sku: input.sku,
          product_name: input.product_name,
          brand: input.brand ?? "",
          ean_gtin: input.ean_gtin ?? "",
          item_name: title,
          bullet_point1: bullets[0] ?? "",
          bullet_point2: bullets[1] ?? "",
          bullet_point3: bullets[2] ?? "",
          bullet_point4: bullets[3] ?? "",
          bullet_point5: bullets[4] ?? "",
          product_description: description,
          generic_keywords: backendKeywords,
          quality_score: String(avgScore),
        });
      } else {
        rows.push({
          sku: input.sku,
          product_name: input.product_name,
          brand: input.brand,
          ean_gtin: input.ean_gtin,
          title,
          bullets,
          description,
          backend_keywords: backendKeywords,
          a_plus_brand_story: latestByField["a_plus_brand_story"]?.content_text ?? "",
          a_plus_features: latestByField["a_plus_features"]?.content_text ?? "",
          quality_score: avgScore,
        });
      }
    }

    if (format === "sp_api_json") {
      const { error: jobError } = await supabase.from("export_jobs").insert({
        project_id,
        format,
        status: "completed",
        listing_count: rows.length,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? "",
      });
      if (jobError) console.error("export_jobs insert error:", jobError);

      await supabase
        .from("content_projects")
        .update({ status: "exported" })
        .eq("id", project_id);

      return jsonResponse({ project_id, format, listing_count: rows.length, data: rows });
    }

    const csvLines = [AMAZON_FLATFILE_HEADERS.join(",")];
    for (const row of rows) {
      const values = AMAZON_FLATFILE_HEADERS.map((h) =>
        escapeCsv((row as Record<string, string>)[h] ?? "")
      );
      csvLines.push(values.join(","));
    }
    const csvContent = csvLines.join("\n");

    const { error: jobError } = await supabase.from("export_jobs").insert({
      project_id,
      format: "amazon_flatfile_csv",
      status: "completed",
      listing_count: rows.length,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? "",
    });
    if (jobError) console.error("export_jobs insert error:", jobError);

    await supabase
      .from("content_projects")
      .update({ status: "exported" })
      .eq("id", project_id);

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_${project.target_country}.csv"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("export error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error");
  }
});
