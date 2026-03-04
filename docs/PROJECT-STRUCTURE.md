# Project structure

One repo, two deployable apps and shared packages. Deployments and dev commands are at the end.

---

## Repository hierarchy

```
hans-crafted-stories/
├── apps/
│   ├── company/                    → hansvanleeuwen.com (agency + operator tools)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── pages/              # Index, Work, About, Writing, Portal, Empire, HansAI, Command, etc.
│   │   │   ├── components/         # Navbar, Footer, portal/, empire/, wiki/, ui (local)
│   │   │   ├── hooks/
│   │   │   ├── integrations/       # Supabase client (company project)
│   │   │   ├── lib/
│   │   │   ├── contexts/
│   │   │   ├── data/
│   │   │   └── assets/
│   │   ├── public/
│   │   ├── scripts/                # check-og-image, inject-static-content, build-ssr, prerender
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── vercel.json             # deploy config (or Cloudflare Pages)
│   │   └── package.json            # @hans/company
│   │
│   └── saas/                       → marketplacegrowth.nl (product: marketing + app)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── pages/              # Landing, public/*, app/*, workspace/*
│       │   ├── components/         # layouts (PublicLayout, AppShell, RequireAuth), app/, ui (local)
│       │   ├── hooks/
│       │   ├── integrations/       # Supabase client (SaaS project), lovable
│       │   ├── lib/
│       │   └── assets/
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── vercel.json
│       └── package.json            # @hans/saas
│
├── packages/
│   ├── ui/                         # Shared design system (shadcn/Radix)
│   │   ├── src/
│   │   │   ├── components/         # button, card, dialog, form, sidebar, toast, etc.
│   │   │   ├── hooks/             # use-mobile, use-toast
│   │   │   ├── lib/               # utils (cn)
│   │   │   └── index.ts           # barrel exports
│   │   ├── package.json           # @hans/ui
│   │   └── tsconfig.json
│   │
│   └── config/                    # Shared tooling
│       ├── eslint.config.js
│       ├── tsconfig.base.json
│       └── package.json           # @hans/config
│
├── supabase/                      # Company Supabase (hansvanleeuwen)
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── supabase-saas/                 # SaaS Supabase (marketplacegrowth)
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── scripts/                       # Repo-level scripts
│   └── create-saas-user.cjs       # One-off: create email/password user in SaaS project
│
├── docs/
├── .github/workflows/             # CI (build-company, build-saas, post-commit-check)
├── package.json                   # Workspace root, dev/build/lint scripts
├── tsconfig.json                  # References apps/* and packages/*
└── .gitignore
```

---

## What lives where

| Path | Purpose |
|------|--------|
| **apps/company** | hansvanleeuwen.com — agency site, Portal, Empire, HansAI, Command, Wiki, auth callback. Own Supabase. |
| **apps/saas** | marketplacegrowth.nl — landing, marketing pages, auth, /app and /app/workspace/:id. Own Supabase. |
| **packages/ui** | Shared UI components and hooks used by both apps. |
| **packages/config** | Shared ESLint and TypeScript base config. |
| **supabase/** | Company Supabase project (migrations, Edge Functions). |
| **supabase-saas/** | SaaS Supabase project (migrations, Edge Functions). |

---

## Commands (from repo root)

| Command | Effect |
|---------|--------|
| `npm run dev:company` | Run company app → http://localhost:8080 (hansvanleeuwen.com) |
| `npm run dev:saas` | Run SaaS app → http://localhost:8081 (marketplacegrowth.nl) |
| `npm run build:company` | Build company app (output: apps/company/dist) |
| `npm run build:saas` | Build SaaS app (output: apps/saas/dist) |
| `npm run build` | Build both apps |
| `npm run lint` | Lint both apps |
| `npm run typecheck` | Type-check both apps |
| `npm run test` | Test both apps |
| `npm run create-saas-user` | Create email/password user in SaaS Supabase (set SUPABASE_SERVICE_ROLE_KEY) |

---

## Deployments

- **Company:** Point your host (e.g. Cloudflare Pages, Vercel) at this repo, build command `npm run build:company`, output `apps/company/dist` → domain hansvanleeuwen.com.
- **SaaS:** Separate project on the same host, build `npm run build:saas`, output `apps/saas/dist` → domain marketplacegrowth.nl.

Each app has its own `vercel.json` (or equivalent) in its directory.
