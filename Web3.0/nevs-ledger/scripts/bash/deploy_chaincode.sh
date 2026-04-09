#!/usr/bin/env bash

# deploy_chaincode_ccaas.sh
# Deploys the CCaaS package to Fabric v2.5

export MSYS_NO_PATHCONV=1
HOST_DIR=$(pwd -W | sed 's|\\|/|g')

echo "🚀 Starting the CCaaS Employment Server..."
cd ../../network/docker
docker-compose -f docker-compose.chaincode.yaml up -d --build
cd ../..

echo "📦 Creating the dummy CCaaS package..."
./package_ccaas.sh

run_peer() {
  docker run --rm --network host \
    -v "$HOST_DIR/../network/organizations:/organizations" \
    -v "$HOST_DIR/../network/configtx:/configtx" \
    -v "$HOST_DIR/../../employment.tar.gz:/tmp/../../employment.tar.gz" \
    -w /tmp \
    -e CORE_PEER_LOCALMSPID=CentralGovtMSP \
    -e CORE_PEER_MSPCONFIGPATH=/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp \
    -e CORE_PEER_ADDRESS=localhost:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.5 peer "$@"
}

echo "⚙️ Installing Chaincode..."
run_peer lifecycle chaincode install /tmp/../../employment.tar.gz

echo "🔍 Querying Installed Chaincode..."
run_peer lifecycle chaincode queryinstalled > installed_cc.txt
cat installed_cc.txt

PACKAGE_ID=$(sed -n -e 's/^Package ID: //p' installed_cc.txt | sed -e 's/, Label:.*$//' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to retrieve Package ID from installed_cc.txt!"
    exit 1
fi

echo "📦 Package ID: $PACKAGE_ID"

# Now we need to restart the employment container to pass it its official PACKAGE_ID
echo "🔄 Restarting Employment Server with injected PACKAGE_ID..."
cd ../../network/docker
CHAINCODE_ID=$PACKAGE_ID docker-compose -f docker-compose.chaincode.yaml up -d
cd ../..

echo "✅ Approving for CentralGovtMSP..."
run_peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.nevs.gov \
    --tls \
    --cafile /organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt \
    --channelID nevs-channel \
    --name employment \
    --version 1.0 \
    --package-id "$PACKAGE_ID" \
    --sequence 1

echo "⏳ Waiting for approval to process..."
sleep 5

echo "✅ Committing Chaincode to nevs-channel..."
run_peer lifecycle chaincode commit -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.nevs.gov \
    --tls \
    --cafile /organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt \
    --channelID nevs-channel \
    --name employment \
    --version 1.0 \
    --sequence 1 \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles /organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt

echo "⏳ Waiting for commit to process..."
sleep 5

echo "🔍 Querying Committed Chaincode..."
run_peer lifecycle chaincode querycommitted -o localhost:7050 \
    --channelID nevs-channel \
    --name employment \
    --cafile /organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt

echo "✅ Deployment Successful!"
