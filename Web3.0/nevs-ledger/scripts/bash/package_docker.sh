#!/usr/bin/env bash
echo "🔄 Fixing CRLF line endings..."
dos2unix *.sh

echo "📦 Packaging Chaincode via fabric-tools container..."
docker run --rm -v "$(pwd -W):/usr/src/app" -w /usr/src/app hyperledger/fabric-tools:2.4 peer lifecycle chaincode package employment_1.0.tar.gz --path ./chaincode/employment --lang golang --label employment_1.0

echo "✅ Package created successfully!"
