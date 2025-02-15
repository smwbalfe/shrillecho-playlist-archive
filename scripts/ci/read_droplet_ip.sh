#!/bin/bash

# Exit on any error
set -e

STATE_FILE="s3://${BUCKET_NAME}/terraform.tfstate"

# Debug variables
echo "Debug: Attempting to fetch state file from: ${STATE_FILE}"

# Create a temporary file for the state
TMP_STATE=$(mktemp)

# Fetch the state file with error handling
if ! aws s3 cp "${STATE_FILE}" "${TMP_STATE}" 2>/tmp/aws_error; then
    echo "Error: Failed to fetch state file from S3"
    echo "AWS Error output:"
    cat /tmp/aws_error
    exit 1
fi

# Debug state file content
echo "Debug: State file content:"
cat "${TMP_STATE}" | head -n 20  # Show first 20 lines for debugging

# Extract IP with error handling
if ! DROPLET_IP=$(jq -r '.resources[] | select(.type == "digitalocean_droplet") | .instances[].attributes.ipv4_address' "${TMP_STATE}" 2>/tmp/jq_error); then
    echo "Error: jq command failed"
    echo "JQ Error output:"
    cat /tmp/jq_error
    exit 1
fi

# Validate IP was found
if [ -z "${DROPLET_IP}" ]; then
    echo "Error: No Droplet IP found in state file"
    echo "Debug: Available resources in state file:"
    jq '.resources[].type' "${TMP_STATE}"
    exit 1
fi

echo "Debug: Successfully extracted Droplet IP"
echo "droplet_ip=${DROPLET_IP}"
echo "droplet_ip=${DROPLET_IP}" >> $GITHUB_OUTPUT

# Cleanup
rm "${TMP_STATE}"