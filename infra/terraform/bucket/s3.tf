terraform {
 required_providers {
   aws = {
     source  = "hashicorp/aws"
     version = "~> 5.0"
   }
 }
}

provider "aws" {
 region = "eu-west-2"
}

resource "aws_s3_bucket" "terraform_state" {
 bucket = "shrillecho-tf-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
 bucket = aws_s3_bucket.terraform_state.id
 versioning_configuration {
   status = "Enabled"
 }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
 bucket = aws_s3_bucket.terraform_state.id

 block_public_acls       = true
 block_public_policy     = true
 ignore_public_acls      = true
 restrict_public_buckets = true
}