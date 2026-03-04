-- Content Builder schema for marketplace content generation

-- Content projects: groups of SKUs for a generation batch
create table if not exists public.content_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_id uuid references public.brands(id) on delete set null,
  marketplace text not null default 'amazon',
  target_country text not null default 'DE',
  tone_of_voice text not null default 'professional',
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null,
  status text not null default 'draft' check (status in ('draft', 'generating', 'review', 'completed', 'exported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_projects enable row level security;

create policy "workspace members can manage content_projects"
  on public.content_projects for all
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

-- Product inputs: raw product data per SKU
create table if not exists public.product_inputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects(id) on delete cascade,
  sku text not null,
  ean_gtin text,
  brand text,
  product_name text not null,
  specs jsonb not null default '{}',
  category_hint text,
  images text[] default '{}',
  certifications text[] default '{}',
  compatibility jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_inputs enable row level security;

create policy "workspace members can manage product_inputs"
  on public.product_inputs for all
  using (
    exists (
      select 1 from public.content_projects cp
      where cp.id = product_inputs.project_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_projects cp
      where cp.id = product_inputs.project_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  );

-- Generated listings: AI output per SKU per field
create type public.listing_field_type as enum (
  'title',
  'bullets',
  'description',
  'backend_keywords',
  'a_plus_brand_story',
  'a_plus_features',
  'a_plus_comparison',
  'image_brief'
);

create type public.listing_status as enum (
  'draft',
  'approved',
  'exported'
);

create table if not exists public.generated_listings (
  id uuid primary key default gen_random_uuid(),
  product_input_id uuid not null references public.product_inputs(id) on delete cascade,
  field_type public.listing_field_type not null,
  content_text text not null default '',
  quality_score int check (quality_score >= 0 and quality_score <= 100),
  validation_errors jsonb not null default '[]',
  version int not null default 1,
  status public.listing_status not null default 'draft',
  marketplace text not null default 'amazon',
  target_country text not null default 'DE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_input_id, field_type, version)
);

alter table public.generated_listings enable row level security;

create policy "workspace members can manage generated_listings"
  on public.generated_listings for all
  using (
    exists (
      select 1 from public.product_inputs pi
      join public.content_projects cp on cp.id = pi.project_id
      where pi.id = generated_listings.product_input_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.product_inputs pi
      join public.content_projects cp on cp.id = pi.project_id
      where pi.id = generated_listings.product_input_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  );

-- Validation rules: marketplace-specific content rules
create type public.validation_rule_type as enum (
  'max_bytes',
  'max_chars',
  'forbidden_phrases',
  'required_attributes',
  'format_pattern',
  'keyword_dedup'
);

create table if not exists public.validation_rules (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null default 'amazon',
  target_country text,
  field_type public.listing_field_type not null,
  rule_type public.validation_rule_type not null,
  rule_config jsonb not null default '{}',
  severity text not null default 'error' check (severity in ('error', 'warning', 'info')),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.validation_rules enable row level security;

create policy "anyone can read validation_rules"
  on public.validation_rules for select
  using (true);

-- Export jobs: batch export tracking
create type public.export_format as enum (
  'amazon_flatfile_csv',
  'sp_api_json',
  'copy_pack_pdf'
);

create type public.export_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects(id) on delete cascade,
  format public.export_format not null default 'amazon_flatfile_csv',
  status public.export_status not null default 'pending',
  output_url text,
  error_message text,
  listing_count int not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.export_jobs enable row level security;

create policy "workspace members can manage export_jobs"
  on public.export_jobs for all
  using (
    exists (
      select 1 from public.content_projects cp
      where cp.id = export_jobs.project_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_projects cp
      where cp.id = export_jobs.project_id
        and public.is_workspace_member(auth.uid(), cp.workspace_id)
    )
  );

-- Indexes for performance
create index idx_content_projects_workspace on public.content_projects(workspace_id);
create index idx_product_inputs_project on public.product_inputs(project_id);
create index idx_generated_listings_product on public.generated_listings(product_input_id);
create index idx_generated_listings_field on public.generated_listings(field_type);
create index idx_validation_rules_lookup on public.validation_rules(marketplace, field_type, active);
create index idx_export_jobs_project on public.export_jobs(project_id);

-- Updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger content_projects_updated_at
  before update on public.content_projects
  for each row execute function public.set_updated_at();

create trigger product_inputs_updated_at
  before update on public.product_inputs
  for each row execute function public.set_updated_at();

create trigger generated_listings_updated_at
  before update on public.generated_listings
  for each row execute function public.set_updated_at();

-- Seed default Amazon validation rules
insert into public.validation_rules (marketplace, field_type, rule_type, rule_config, severity, description) values
  ('amazon', 'title', 'max_chars', '{"max": 200}', 'error', 'Amazon title must be under 200 characters'),
  ('amazon', 'title', 'forbidden_phrases', '{"phrases": ["best", "#1", "number one", "top rated", "cheapest", "guaranteed", "free"]}', 'error', 'Amazon title cannot contain superlatives or guarantees'),
  ('amazon', 'bullets', 'max_chars', '{"max": 1000}', 'error', 'Each bullet point must be under 1000 characters'),
  ('amazon', 'bullets', 'forbidden_phrases', '{"phrases": ["cure", "treat", "prevent", "diagnose", "FDA approved", "clinically proven", "miracle", "guaranteed results"]}', 'error', 'Bullets cannot contain medical claims or guarantees'),
  ('amazon', 'backend_keywords', 'max_bytes', '{"max": 250}', 'error', 'Backend search terms must be under 250 bytes'),
  ('amazon', 'backend_keywords', 'keyword_dedup', '{}', 'warning', 'Backend keywords should not duplicate words from title or bullets'),
  ('amazon', 'backend_keywords', 'forbidden_phrases', '{"phrases": ["ASIN", "best", "cheapest", "amazing", "quality"]}', 'warning', 'Backend keywords should not contain subjective terms'),
  ('amazon', 'description', 'max_chars', '{"max": 2000}', 'error', 'Product description must be under 2000 characters'),
  ('amazon', 'a_plus_brand_story', 'max_chars', '{"max": 500}', 'warning', 'A+ brand story should be concise (under 500 chars)'),
  ('amazon', 'a_plus_features', 'max_chars', '{"max": 1500}', 'warning', 'A+ feature modules should be under 1500 chars total');

-- DE-specific stricter rules
insert into public.validation_rules (marketplace, target_country, field_type, rule_type, rule_config, severity, description) values
  ('amazon', 'DE', 'title', 'forbidden_phrases', '{"phrases": ["garantie", "beste", "nr. 1", "heilmittel", "wundermittel", "kostenlos"]}', 'error', 'DE: Title cannot contain German superlatives or guarantees'),
  ('amazon', 'DE', 'bullets', 'forbidden_phrases', '{"phrases": ["heilt", "behandelt", "verhindert", "klinisch erwiesen", "Wundermittel"]}', 'error', 'DE: Bullets cannot contain German medical claims');

-- FR-specific rules
insert into public.validation_rules (marketplace, target_country, field_type, rule_type, rule_config, severity, description) values
  ('amazon', 'FR', 'title', 'forbidden_phrases', '{"phrases": ["meilleur", "n°1", "garanti", "gratuit", "miracle"]}', 'error', 'FR: Title cannot contain French superlatives or guarantees'),
  ('amazon', 'FR', 'bullets', 'forbidden_phrases', '{"phrases": ["guérit", "traite", "prévient", "cliniquement prouvé", "miracle"]}', 'error', 'FR: Bullets cannot contain French medical claims');
