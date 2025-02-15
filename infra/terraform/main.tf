terraform {
 required_providers {
  digitalocean = {
    source  = "digitalocean/digitalocean"
    version = "~> 2.0"
  }
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.0"
  }
 }

backend "s3" {
   bucket  = "shrillecho-tf-state"
   key     = "terraform.tfstate"
   region  = "eu-west-2"
   encrypt = true
 }
}

provider "digitalocean" {
 token = var.do_token
}

variable "do_token" {
 description = "DigitalOcean API Token"
 type        = string
 sensitive   = true
}

resource "digitalocean_droplet" "web" {
 name     = "shrillecho-backend"
 region   = "nyc1"
 size     = "s-1vcpu-1gb"
 image    = "ubuntu-22-04-x64"
 tags     = ["web", "terraform"]
 ssh_keys = ["5f:19:30:49:c4:47:17:81:e7:c6:88:5d:ac:01:65:b2"]
}

output "droplet_ip" {
 value = digitalocean_droplet.web.ipv4_address
}
