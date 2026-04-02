#!/usr/bin/env bash

# package_ccaas.sh
# Creates the dummy chaincode package required for Fabric v2.5 CCaaS

# 1. Create connection.json
cat <<EOF > connection.json
{
  "address": "employment.cc:9999",
  "dial_timeout": "10s",
  "tls_required": false
}
EOF

# 2. Create metadata.json
cat <<EOF > metadata.json
{
  "type": "ccaas",
  "label": "employment-cc"
}
EOF

# 3. Compress them into the required tarball format
tar cfz code.tar.gz connection.json
tar cfz ../../employment.tar.gz metadata.json code.tar.gz

# 4. Clean up the temporary files
rm connection.json metadata.json code.tar.gz

echo "✅ Dummy CCaaS package created at ../../employment.tar.gz"
