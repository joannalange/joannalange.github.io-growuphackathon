output "zone_id" {
  description = "Cloudflare zone ID for growuphackathon.pl"
  value       = cloudflare_zone.main.id
}

output "name_servers" {
  description = "Nameservers Cloudflare assigned this zone -- set these at the registrar (cyberfolks.pl) during the cutover step, not before."
  value       = cloudflare_zone.main.name_servers
}
