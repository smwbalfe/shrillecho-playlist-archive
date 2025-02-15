#!/bin/bash

STATE_FILE="s3://${BUCKET_NAME}/terraform.tfstate"
DROPLET_IP=$(aws s3 cp "${STATE_FILE}" - | jq -r '.resources[] | select(.type == "digitalocean_droplet") | .instances[].attributes.ipv4_address')
echo $DROPLET_IP
echo "droplet_ip=${DROPLET_IP}" >> $GITHUB_OUTPUT