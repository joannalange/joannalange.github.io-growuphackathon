variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns this zone and the Worker"
  type        = string
  nullable    = false
}

variable "domain" {
  description = "Apex domain for the site"
  type        = string
  default     = "growuphackathon.pl"
  nullable    = false
}

variable "worker_name" {
  description = "Cloudflare Worker name (static assets, deployed via wrangler) -- must match wrangler.jsonc's \"name\" field"
  type        = string
  default     = "growuphackathon"
  nullable    = false
}
