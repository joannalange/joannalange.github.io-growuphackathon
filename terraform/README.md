# Terraform — Cloudflare infrastructure

Manages the Cloudflare-side infrastructure for the growuphackathon.pl migration
(see `docs/plans/cloudflare-pages-migration.md`): the zone, baseline TLS
settings, and the Worker custom domain binding. It does **not** deploy the
site itself — that stays `wrangler deploy` from CI, so the existing
`seo-checks.yml` build/gate pipeline remains the single source of truth for
what gets built.

## Why a Worker, not Pages

Started with a Cloudflare Pages project; switched after Pages project
creation kept failing with an opaque 403 even with the "Cloudflare Pages"
token permission granted. A sibling project in this org (`growup-webcrew`)
already runs static hosting as a plain Worker with static assets, which is
also Cloudflare's own current recommendation for new projects over Pages. See
`../wrangler.jsonc` at the repo root.

## Bootstrap order (first-time setup only)

`cloudflare_workers_custom_domain` requires the Worker to already exist and
be invokable -- Terraform does not create the Worker itself (that's
`wrangler deploy`'s job, kept separate so Terraform and Wrangler never fight
over the same resource). So the first-ever setup is two passes:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in the real account ID
export CLOUDFLARE_API_TOKEN="..."               # never committed, never logged
terraform init
terraform apply   # creates zone + TLS settings only, first time through

# from repo root: build and deploy once so the Worker exists
pnpm build
wrangler deploy

# back in terraform/: now the custom domain binding can succeed
terraform apply
```

After that, `terraform apply` is idempotent as usual and `wrangler deploy` in
CI handles every subsequent site update independently.

## State

Local state (`terraform.tfstate`), gitignored. This is a single-operator
project at its current scale — a remote backend (e.g. R2, see the `cloudflare`
skill's terraform patterns reference) is a reasonable future upgrade if that
changes, not a blocker now.

## What this does NOT do

- Does not touch DNS at the registrar (cyberfolks.pl) — nameserver delegation
  is a manual step at cutover time, outside Terraform's reach entirely. It
  also does not manage the apex DNS record itself once delegated -- Workers
  Custom Domains auto-manage their own DNS record; adding one manually would
  make the Custom Domain creation fail outright.
- Does not configure the AI Crawl Control / bot allowlist — that's a one-time
  dashboard toggle by design (see the migration plan's reasoning), not
  something worth a scoped API permission for.
- Does not deploy the site build — `wrangler deploy` does that, against the
  Worker this config binds the custom domain to.
