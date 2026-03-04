# Amazon Marketplace Content Builder — Blueprint

## 1. What We're Building

An AI-powered content factory that takes raw product data (PIM/ERP/Magento/CSV) to Amazon-ready listings, including SEO structure, policy checks, variant logic, translations, and measurable output quality.

---

## 2. Core Features

### A. Content Outputs (Per ASIN/SKU)

| Output | Details |
|--------|---------|
| **Title** | Marketplace/country-specific, SEO-optimized, under 200 characters |
| **5 Bullets** | Benefit-first + specs + proof |
| **Product Description** | HTML-free, Amazon-style |
| **Backend Search Terms** | 250 bytes-safe, no forbidden terms |
| **A+ Content** | Module copy (headline + body), comparison table content, brand story blocks |
| **Image Prompts/Briefs** | "Shot list" for studio + lifestyle, alt-text + compliance checklist |
| **Variation Copy** | Parent/child: color/size/pack |

### B. Guardrails (Differentiator)

- **Amazon policy filters**: forbidden claims, medical claims, "best", "#1", guarantee language, misleading superlatives
- **Byte/length validators**: title length per marketplace, backend 250 bytes
- **Keyword dedup**: no keyword stuffing
- **Competitor risk**: warning on other brands' names / IP risk

### C. Quality Score (Per Listing)

A score that makes content "publishable":

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Completeness | 25% | All attributes present |
| Readability | 25% | B1/B2 language level |
| Keyword Coverage | 20% | Target keywords incorporated |
| Compliance | 20% | Policy-safe |
| Consistency | 10% | Specs match input data |

---

## 3. AI Architecture (LLM + Rules + Retrieval)

### Pipeline

```
Normalize → Classify → Retrieve → Generate → Validate → Repair → Export
```

| Step | What It Does |
|------|-------------|
| **Normalize** | Clean product data (EAN, measurements, materials, compatibility) |
| **Classify** | Amazon category + audience + intent (replacement/upgrade/premium) |
| **Retrieve** | Brand style + previous best-performers + category rules (knowledge base) |
| **Generate** | Per-field micro-task prompt (title/bullets/A+/backend) |
| **Validate** | Rules + heuristics + bytes/length checks |
| **Repair** | If validator fails → LLM fixes specifically |
| **Export** | Amazon flatfile / API-ready JSON + changelog |

### Why This Works

- LLM handles creativity + language
- Rules handle compliance and constraints
- Retrieval handles consistency & brand style

---

## 4. Data Input

### MVP Input (Start Fast)

- SKU, brand, product name
- Key specs (5-10 attributes)
- 1-5 images
- Category hint
- Target country/language

### Pro Input (Becomes Your Moat)

- PIM attributes + allowed values
- Compatibility (vehicle fitment / models)
- Certificates/claims (only permitted evidence)
- Competitor keywords (optional)
- Pricing tier + positioning

---

## 5. UX Flow

### "Wizard" Flow (Single SKU / Small Batch)

1. Choose marketplace + country: Amazon DE/FR/ES/IT/NL
2. Upload feed (CSV / Magento / PIM)
3. Choose brand tone-of-voice (strict / premium / technical)
4. Generate → Quality Score → Fix suggestions
5. "Approve & Export" + bulk edit

### Bulk Mode (What Agencies Want)

- 1,000 SKUs at once
- Issues queue: "Missing attribute", "Policy risk", "Too long"
- Batch repair: 1 click "Fix all policy issues"

---

## 6. Output Formats

- Amazon flatfile templates (category-specific)
- SP-API JSON (roadmap)
- Copy pack PDF for internal review
- Changelog per field (what was adjusted)

---

## 7. Tech Stack

### Backend
- Supabase (Postgres + Auth + Edge Functions + Storage)
- Queue: Edge Function chaining or BullMQ equivalent
- Storage: Supabase Storage (images, exports)

### AI Layer
- LLM router: OpenAI/Claude mix (per task)
- Embeddings + retrieval: pgvector/Supabase
- Rule engine: JSON rules + tests
- Observability: prompts + outputs + validator logs

### Integrations (Roadmap)
- Amazon SP-API (publish + status)
- PIM: Akeneo, Pimcore
- Magento/Shopify feed import
- n8n connector (workflows + approvals)

---

## 8. Three Killer Modules

### 1. Policy & Compliance Copilot
- "Risk phrases" highlight
- Safe rewrite + rationale
- Country-specific claim rules (DE stricter, FR nuance)

### 2. Keyword-to-Structure Engine
- Intent mapping → bullet 1/2/3
- Synonyms per language
- Backend terms unique & byte-safe

### 3. Content Governance
- Brand style lock (word list, forbidden words, tone)
- Multi-user approvals
- Versioning per listing

---

## 9. Monetization

| Plan | For Whom | Pricing Driver |
|------|----------|---------------|
| **Starter** | Small sellers | Credits per SKU/month |
| **Pro** | Growth sellers | Bulk + exports + governance |
| **Agency** | Agencies | Seats + clients + white-label |
| **Enterprise** | Brands | SP-API publish + SSO + audit trails |

---

## 10. MVP Scope (14 Days)

### Must-Haves

- Import CSV
- Generate: Title + 5 bullets + backend terms + description
- Validator: length + forbidden words + duplicates
- Repair loop
- Export: CSV output template per country

### Nice-to-Have

- Brand style preset
- A+ content generator
- Image brief generator

### Quick Wins (Immediate Conversion)

1. **Quality score + auto-fix** — users immediately feel "this is publish-ready"
2. **Country variants in 1 click** (DE/FR/ES/IT/NL)
3. **Backend 250-bytes safe generator** — everyone fails here without tooling
