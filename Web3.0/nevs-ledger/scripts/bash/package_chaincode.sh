#!/usr/bin/env bash
source setup-env.sh

cd chaincode/employment
echo "📦 Dependencies resolved out-of-band..."

cd ../..
echo "📦 Packaging Chaincode V1..."
export CORE_PEER_LOCALMSPID="CentralGovtMSP"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
export CORE_PEER_ADDRESS="localhost:7051"
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
export FABRIC_CFG_PATH="$PROJECT_ROOT/../network/configtx"

peer lifecycle chaincode package employment_1.0.tar.gz \
    --path ./chaincode/nevs \
    --lang golang \
    --label employment_1.0

echo "✅ Package created: employment_1.0.tar.gz"
