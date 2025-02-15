if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "Bucket already exists, skipping creation"
    echo "bucket_exists=true" >> $GITHUB_OUTPUT
else
    echo "Bucket does not exist, will create"
    echo "bucket_exists=false" >> $GITHUB_OUTPUT
fi