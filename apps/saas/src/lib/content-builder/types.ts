export type ListingFieldType =
  | "title"
  | "bullets"
  | "description"
  | "backend_keywords"
  | "a_plus_brand_story"
  | "a_plus_features"
  | "a_plus_comparison"
  | "image_brief";

export type ListingStatus = "draft" | "approved" | "exported";

export type ValidationRuleType =
  | "max_bytes"
  | "max_chars"
  | "forbidden_phrases"
  | "required_attributes"
  | "format_pattern"
  | "keyword_dedup";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationRule {
  id: string;
  marketplace: string;
  target_country: string | null;
  field_type: ListingFieldType;
  rule_type: ValidationRuleType;
  rule_config: Record<string, unknown>;
  severity: ValidationSeverity;
  description: string | null;
  active: boolean;
}

export interface ValidationError {
  rule_id: string;
  rule_type: ValidationRuleType;
  severity: ValidationSeverity;
  message: string;
  field_type: ListingFieldType;
  details?: Record<string, unknown>;
}

export interface QualityScore {
  total: number;
  completeness: number;
  readability: number;
  keyword_coverage: number;
  compliance: number;
  consistency: number;
}

export interface ListingContent {
  title?: string;
  bullets?: string[];
  description?: string;
  backend_keywords?: string;
  a_plus_brand_story?: string;
  a_plus_features?: string;
  a_plus_comparison?: string;
  image_brief?: string;
}

export interface ProductInput {
  id: string;
  sku: string;
  ean_gtin?: string;
  brand?: string;
  product_name: string;
  specs: Record<string, string>;
  category_hint?: string;
  images: string[];
  certifications: string[];
  compatibility?: Record<string, unknown>;
}

export interface ContentProject {
  id: string;
  name: string;
  brand_id?: string;
  marketplace: string;
  target_country: string;
  tone_of_voice: string;
  workspace_id: string;
  status: string;
}
