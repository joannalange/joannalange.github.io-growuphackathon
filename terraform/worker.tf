# Custom domain binding only -- the Worker itself (script + static assets) is
# NOT managed here. It's created and deployed entirely by `wrangler deploy` in
# CI, matching the project's own gotcha about not letting Terraform and
# Wrangler fight over the same resource. This means the very first apply of
# this resource will fail until a Worker named var.worker_name has been
# deployed at least once via wrangler -- see terraform/README.md.
#
# Custom Domains auto-manage their own DNS record (unlike Pages, which needed
# a manual CNAME) -- do not add a cloudflare_dns_record for this hostname,
# Cloudflare will reject the Custom Domain creation if one already exists.
resource "cloudflare_workers_custom_domain" "apex" {
  account_id = var.cloudflare_account_id
  zone_id    = cloudflare_zone.main.id
  hostname   = var.domain
  service    = var.worker_name
}
