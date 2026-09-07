resource "cloudflare_zone" "main" {
  account = { id = var.cloudflare_account_id }
  name    = var.domain
  # Full nameserver delegation, not partial/CNAME setup. This is a real decision,
  # not the provider default going unnoticed: dns.tf's proxied apex CNAME (relying
  # on Cloudflare's flattening) only works under full delegation.
  type = "full"
}

resource "cloudflare_zone_setting" "ssl" {
  zone_id    = cloudflare_zone.main.id
  setting_id = "ssl"
  value      = "strict"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = cloudflare_zone.main.id
  setting_id = "always_use_https"
  value      = "on"
}

resource "cloudflare_zone_setting" "min_tls_version" {
  zone_id    = cloudflare_zone.main.id
  setting_id = "min_tls_version"
  value      = "1.2"
}

resource "cloudflare_zone_setting" "tls_1_3" {
  zone_id    = cloudflare_zone.main.id
  setting_id = "tls_1_3"
  value      = "on"
}
