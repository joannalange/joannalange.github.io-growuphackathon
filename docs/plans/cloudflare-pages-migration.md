# Plan: Migrate growuphackathon.pl from GitHub Pages to Cloudflare

## Goal

Move hosting from GitHub Pages to Cloudflare to cut TTFB (currently ~730ms baseline, confirmed
via Lighthouse on the live site) via Cloudflare's edge network, with zero regression to AI
crawler access, existing SEO signals, email delivery, or the current CI pipeline — measured, not
assumed.

## Current state (confirmed 2026-09-06)

- DNS: nameservers at `cyberfolks.pl` (Polish registrar), A records point directly at GitHub
  Pages (`185.199.108-111.153`). No Cloudflare proxy sits in front of the site today — the
  existing "Cloudflare Web Analytics" beacon is a standalone script tag, unrelated to DNS/CDN.
- Site is 100% static output (`output: 'static'` in `astro.config.mjs`); no `src/pages/admin`
  or Keystatic routes remain in this repo (admin app lives in the separate `growup-webcrew`
  repo per [[project_growup_hackathon]]). The `@astrojs/node` adapter in `astro.config.mjs` is
  therefore vestigial — confirm before migration whether it's still needed for anything, or
  drop it to simplify the build.
- CI (`static.yml`) builds with the existing `pnpm build` and deploys `dist/client` via
  `actions/deploy-pages@v4` — a GitHub-native action, not portable to Cloudflare as-is.
- GSC is verified via an HTML verification file; sitemap submitted 2026-09-05.
- **Email is live via Google Workspace** — confirmed by the Task 1 DNS audit (see below). Any
  DNS cutover must carry these records forward exactly, or `kontakt@`/`rodo@` mail breaks.

## Correction to a claim made earlier in conversation

I said migrating growuphackathon.pl to Cloudflare would "fix the CI 403 on deepkind.org too."
That's wrong — deepkind.org's Cloudflare zone and growuphackathon.pl's would be two separate
zones under two separate domains. Moving this site's hosting has no effect on deepkind.org's
bot protection. Flagging the correction rather than letting it stand uncorrected.

## Constraints

- **DNS is a shared, hard-to-reverse resource.** Every step that touches nameservers or DNS
  records requires explicit confirmation before executing — this plan stops at checkpoints for
  that reason, not because the technical steps are unclear.
- **Cloudflare blocks AI crawlers by default since Jul 2025** on any domain added to a
  Cloudflare account (per `.claude/rules/seo.md` / `seo-ai-search.md`, and already flagged as a
  known gotcha in [[project_seo_campaign_status]]). This must be explicitly configured before
  cutover, not after — an AI-search visibility gap between cutover and noticing the gap is a
  real regression, not a theoretical one.
- **Zero-downtime requirement**: growuphackathon.pl is an active recruiting funnel (registration
  open, countdown timer on the homepage) — no outage window is acceptable.
- **Email must survive the cutover** — Google Workspace MX/SPF/DKIM/DMARC, see Task 1.
- Must preserve: GSC verification, the current CI's SEO gates (structured data, linkinator,
  Lighthouse), and the existing PR-based workflow (worktrees, `seo-checks.yml`).

## Infrastructure as code

All Cloudflare-side resources (zone, baseline TLS settings, mail records, Worker custom domain
binding) are managed via Terraform in a **separate sibling repo**, `growup-iac` (at
`~/projects/deepkind-org/growup-iac`, `growuphackathon/` subdirectory) — not ad-hoc dashboard
clicks, not one-off API calls, and deliberately not inside this repo. It started here (`terraform/`
in this repo) but got moved out after that location's state file was destroyed by a routine
worktree cleanup (this repo's normal workflow deletes a worktree after its PR merges; the
Terraform state was gitignored and living inside that worktree, so it went with it — recovered
via `terraform import`, and moved out permanently rather than risk it again). Account IDs and
infra state references don't belong alongside public site source anyway. See that repo's
`growuphackathon/README.md` for setup and the bootstrap-order gotcha (Custom Domain creation
needs the Worker to already exist).

**Architecture: Workers with static assets, not Cloudflare Pages.** Started with Pages
(`cloudflare_pages_project` + `cloudflare_pages_domain`); Pages project creation via API kept
403ing (`code 10000, Authentication error`) even with the "Cloudflare Pages" token permission
granted and confirmed saved — ruled out propagation delay, resource scope, and account
activation as causes, never found the actual root cause. Switched to a plain Worker with static
assets (`wrangler.jsonc` at repo root, `cloudflare_workers_custom_domain` in Terraform) after
finding `growup-webcrew` (sibling project, same Cloudflare account) already runs this way
successfully, and it's Cloudflare's own current recommendation for new projects over Pages
generally. See [[project_cloudflare_migration_status]] for the full gotcha list.

What Terraform does NOT do, by design: touch DNS at the registrar (cyberfolks.pl — outside its
reach entirely), configure the AI Crawl Control allowlist (kept a manual one-time dashboard
toggle rather than granting a scoped API permission for a single checkbox), or deploy the site
build (that stays `wrangler deploy` in CI, against the Worker Terraform binds the domain to).

## Known unknowns (confirm before starting)

- [x] Full nameserver delegation vs. partial CNAME — **decided: full delegation**
      (`type = "full"` in `terraform/zone.tf`, explicit). The Worker Custom Domain design
      requires it (Custom Domains need Cloudflare to be authoritative for the zone).
- [x] Build in Cloudflare's own CI vs. GitHub Actions + `wrangler deploy` publish step —
      **decided: GitHub Actions + wrangler**, reuses the existing `seo-checks.yml` gates
      verbatim, avoids two divergent build pipelines.

## Tasks

- [x] 1. Audit all existing DNS records at cyberfolks.pl (A, MX, TXT, CNAME) — done 2026-09-06
      via public `dig` lookups (no registrar login needed). Findings:
      - A: `185.199.108-111.153` (GitHub Pages)
      - MX: `1 SMTP.GOOGLE.COM` — Google Workspace
      - TXT (SPF): `v=spf1 include:_spf.google.com include:_spf.cyberfolks.pl ~all`
      - TXT (DMARC, at `_dmarc`): `v=DMARC1; p=none;`
      - TXT: `google-site-verification=v-6SO1rbFinkMhhU2XQSEtnDaeksyP2AG5Pgko76t_I` (Workspace
        domain verification, separate from the GSC HTML-file verification)
      - DKIM: `google._domainkey` has a valid Google Workspace DKIM key
      - `www` CNAMEs to `joannalange.github.io` — confirmed correct (GitHub Pages'
        standard custom-domain pattern; `www` redirects cleanly to the apex, verified 200)
      - SRV: `_autodiscover._tcp` → `10 10 443 autodiscover.s179.cyberfolks.pl` (mail-client
        autodiscovery, hosted by cyberfolks.pl itself, separate from Google Workspace)
      - No CAA record exists (nothing to conflict with Cloudflare's auto-issued cert)
      - **All of the above already recreated in Cloudflare DNS** — see growup-iac's `mail.tf`.
        Applied 2026-09-07, TTL 300s on every record (deliberately low — see Rollback Procedure
        below). Inert until nameservers actually delegate; zero effect on live mail today.
- [x] 2. Add growuphackathon.pl to Cloudflare via Terraform (`cloudflare_zone` + 4 TLS
      `cloudflare_zone_setting` resources) — applied 2026-09-06. Zone status `pending` until
      nameservers are delegated at cutover.
- [x] 3. Create the Worker + custom domain binding — applied 2026-09-06. Live and verified at
      the `workers.dev` preview URL (200, correct site) before the custom domain was attached.
- [ ] 4. **Revised 2026-09-06 — cannot be done in advance.** Originally planned as a pre-cutover
      step; discovered the Cloudflare dashboard blocks configuring AI Crawl Control at all until
      the zone is fully active ("Finish onboarding to control AI Crawlers... update your
      nameservers"), not just added. So this folds into Task 7 instead: the moment nameservers
      finish propagating, immediately go to AI Crawl Control → Crawlers/Security tab and confirm
      Google-Extended, PerplexityBot, Perplexity-User, OAI-SearchBot, ChatGPT-User, and
      Claude-SearchBot are all set to Allow, not Block. There will be a brief window between
      propagation completing and this being set — minutes, not a real practical risk given how
      infrequently AI crawlers hit any single page, but a zero-gap guarantee isn't achievable
      here. Do not rely on robots.txt alone regardless; Cloudflare's bot handling happens at the
      network edge, before robots.txt is ever consulted. Manual step, deliberately not automated
      (see Infrastructure as Code section).
- [x] 5. CI deploys via `wrangler deploy` on every push to main (`.github/workflows/
      cloudflare-deploy.yml`, PR #89), in parallel with GitHub Pages (neither replaces the
      other yet). Uses a `CLOUDFLARE_API_TOKEN` secret scoped to just `Workers Scripts: Edit`
      — narrower than the Terraform token, set by the user directly rather than by the agent.
      First real run confirmed working end to end 2026-09-06.
- [x] 6. Full technical audit against the `workers.dev` preview — done 2026-09-06, no
      regressions. Lighthouse: performance 90 / accessibility 100 / best-practices 100 / seo
      100. **TTFB 70ms vs the ~730ms GitHub Pages baseline** — the headline result validating
      this migration's premise. robots.txt/sitemap correctly reference the production domain,
      all 3 pages 200, 404 handling correct, HTML byte-identical to the live production site,
      static assets spot-checked correct.
- [ ] 7. **Checkpoint — get explicit go-ahead before this step.** Lower DNS TTL on the current
      A records at cyberfolks.pl 24-48h in advance, then delegate nameservers to Cloudflare
      (the assigned nameservers are in the `name_servers` Terraform output). The mail records
      are already staged in Cloudflare DNS (Task 1) — nothing to recreate in the moment, just
      confirm they're still correct before flipping nameservers. The moment propagation is
      confirmed, immediately do Task 4's AI Crawl Control allowlist — it can only be configured
      once the zone goes active, so it happens right here, not before. **See Rollback Procedure
      below — read it before starting this step, not during.**
- [ ] 8. Monitor propagation (`dig`, multiple resolvers) and confirm: site resolves, HTTPS cert
      issues correctly, GSC still shows the property verified, sitemap still fetches clean,
      and a test email round-trip still works (send + receive via `kontakt@`).
- [ ] 9. Re-measure TTFB and full Lighthouse mobile run against the live domain post-cutover —
      compare against the ~730ms GitHub Pages baseline captured 2026-09-06. Report the actual
      number, not the expected one.
- [ ] 10. Keep the GitHub Pages `static.yml` deploy path intact (do not delete) for at least one
      full week post-cutover as a fast rollback option (revert DNS, GitHub Pages is still
      serving the last-deployed build). Remove only after that window with no issues.
- [ ] 11. Update [[project_seo_campaign_status]] and [[project_cloudflare_migration_status]]
      memory once stable.

## Rollback Procedure (added 2026-09-06 — read before Task 7, not during)

Mail continuity is the highest-stakes part of this cutover — growuphackathon.pl is at a crucial
stage of the program, and a mail outage right now would be tragic, not just inconvenient. This
section exists so a rollback decision is never made under pressure with undocumented steps.

**Honest caveat first**: DNS *record* TTLs (MX, TXT, etc.) are fully within our control and can
be made near-instant (see below). The nameserver *delegation* itself is cached according to the
`.pl` registry's own TTL for that delegation — neither we nor Cloudflare control that directly.
In practice this is fast (minutes), but it is not something either direction of this cutover can
promise as truly instant. Said plainly rather than overpromised.

**What's already done to make rollback fast:**
- Every DNS record created in Cloudflare (mail records, Task 1) has an explicit 300s TTL — not
  Cloudflare's default. If a correction or rollback is needed, it propagates in minutes, not
  whatever a long TTL would have cached.
- The exact rollback action is a single, pre-documented step: revert nameservers at cyberfolks.pl
  back to exactly `ns1.cyberfolks.pl`, `ns2.cyberfolks.pl`, `ns3.cyberfolks.pl`. No lookup needed
  under pressure.

**Abort criteria — decided now, not in the moment:**
- The site or the MX record doesn't resolve correctly within 15 minutes of expected propagation, OR
- A test email sent immediately after cutover doesn't arrive within 30 minutes.

If either triggers: revert nameservers immediately. Don't wait-and-see past these thresholds.

**One reassuring, not excusing, fact about mail specifically**: SMTP has built-in retry. A sending
mail server that hits a temporary MX problem typically queues and retries for 24-72 hours rather
than bouncing immediately. A brief misconfiguration risks *delay*, not necessarily silent loss —
this doesn't make it acceptable to get wrong, but it means a short window isn't a hair-trigger
cliff either.

**Post-cutover verification** (Task 8) should run immediately, not be manually eyeballed — check
every record (site, MX, SPF, DKIM, DMARC, autodiscover SRV) resolves to the expected value within
the first few minutes, before considering the cutover settled.

## Review Criteria

- TTFB measurably lower than the ~730ms GitHub Pages baseline — measured on the live domain,
  not the `workers.dev` preview.
- Zero AI-crawler regression: `curl` each of the six bot user-agents against the live domain
  post-cutover and confirm 200s, not blocks/challenges.
- GSC property still verified, sitemap still submitted and fetching clean.
- Zero email regression: MX/SPF/DKIM/DMARC recreated exactly, test email round-trip confirmed
  working post-cutover.
- `seo-checks.yml` and the Cloudflare deploy workflow both green on the deploying branch before
  this is considered done.
