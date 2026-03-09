# Project structure

One repo, one deployable app (`apps/personal`) plus shared packages and infrastructure.

---

## Repository hierarchy

```
hans-crafted-stories/
├── apps/
│   └── personal/                   → hansvanleeuwen.com (agency + operator tools)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── pages/              # Index, Work, About, Writing, Portal, Empire, HansAI, Command, etc.
│       │   ├── components/         # Navbar, Footer, portal/, empire/, wiki/, ui (local)
│       │   ├── hooks/
│       │   ├── integrations/       # Supabase client (personal app project)
│       │   ├── lib/
│       │   ├── contexts/
│       │   ├── data/
│       │   └── assets/
│       ├── public/
│       ├── scripts/                # check-og-image, inject-static-content, build-ssr, prerender
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── vercel.json             # deploy config (or Cloudflare Pages)
│       └── package.json            # @hans/personal
│
├── packages/
│   ├── ui/                         # Shared design system (shadcn/Radix)
│   │   ├── src/
│   │   │   ├── components/         # button, card, dialog, form, sidebar, toast, etc.
│   │   │   ├── hooks/              # use-mobile, use-toast
│   │   │   ├── lib/                # utils (cn)
│   │   │   └── index.ts            # barrel exports
│   │   ├── package.json            # @hans/ui
│   │   └── tsconfig.json
│   │
│   └── config/                     # Shared tooling
│       ├── eslint.config.js
│       ├── tsconfig.base.json
│       └── package.json            # @hans/config
│
├── supabase/                       # Personal app Supabase (hansvanleeuwen)
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── docs/
├── .github/workflows/              # CI (build-personal, post-commit-check)
├── package.json                    # Workspace root, dev/build/lint scripts
├── tsconfig.json                   # References apps/* and packages/*
└── .gitignore
```

---

## What lives where

| Path | Purpose |
|------|--------|
| **apps/personal** | hansvanleeuwen.com — agency site, Portal, Empire, HansAI, Command, Wiki, auth callback. Own Supabase. |
| **packages/ui** | Shared UI components and hooks used by the personal app. |
| **packages/config** | Shared ESLint and TypeScript base config. |
| **supabase/** | Personal app Supabase project (migrations, Edge Functions). |

---

## Commands (from repo root)

| Command | Effect |
|---------|--------|
| `npm run dev:personal` | Run personal app → http://localhost:8080 (hansvanleeuwen.com) |
| `npm run build:personal` | Build personal app (output: apps/personal/dist) |
| `npm run build` | Build the personal app |
| `npm run lint` | Lint the personal app |
| `npm run typecheck` | Type-check the personal app |
| `npm run test` | Test the personal app |

---

## Deployment

- **Personal:** Point your host (e.g. Cloudflare Pages, Vercel) at this repo, build command `npm run build:personal`, output `apps/personal/dist` → domain hansvanleeuwen.com.
