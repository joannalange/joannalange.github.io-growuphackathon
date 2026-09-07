# GrowUp Hackathon 2026

Source for [growuphackathon.pl](https://growuphackathon.pl) — a free, nationwide hackathon for
young adults, organized by Fundacja DeepKind and the GrowUp Team. Built with
[Astro](https://astro.build), static output, no server-side logic.

## Stack

- **Astro 6** (static output) + React islands for Keystatic
- **Keystatic** for content — editorial copy, partner logos, and team/people entries are
  content-managed, not hardcoded (see `src/content/`)
- **TypeScript**, **Vitest** for unit tests, **Playwright** for e2e
- **pnpm** as the package manager

## Local development

```bash
pnpm install
pnpm dev          # dev server at localhost:4321
pnpm build        # production build to dist/client
pnpm preview       # preview the production build locally
```

No environment variables are required for local dev.

## Testing

```bash
pnpm test          # unit tests (Vitest)
pnpm test:e2e       # end-to-end tests (Playwright)
pnpm typecheck      # astro check
```

## Content editing

Editorial content (page copy, partner logos, team bios) lives under `src/content/` and is
managed through Keystatic. The admin app itself was split out into a separate repo
(`growup-webcrew`) — this repo only reads the content Keystatic produces.

## Deployment

Currently deployed to **GitHub Pages** (`.github/workflows/static.yml`), with a parallel
migration to **Cloudflare Workers** in progress (`.github/workflows/cloudflare-deploy.yml`) —
see `docs/plans/cloudflare-pages-migration.md` for the migration plan and current status.
Cloudflare-side infrastructure (DNS, zone settings, the Worker's custom domain binding) is
managed as Terraform in a separate repo, `growup-iac`, deliberately kept out of this one.

Every PR runs `.github/workflows/seo-checks.yml`: structured data validation, broken-link
checks, and a Lighthouse CI gate (accessibility, SEO, and performance are error-level at a 0.9
minimum score; best-practices is warn-level).

## Attribution

Originally based on [DziQTrueCoder's personal
site](https://github.com/DziQTrueCoder/dziqtruecoder.github.io), substantially rewritten since
for GrowUp Hackathon.
