#!/usr/bin/env bash

echo "⚙️ Installing CCaaS Chaincode..."
peer lifecycle chaincode install /tmp/../../employment.tar.gz

echo "🔍 Querying Installed Chaincode..."
peer lifecycle chaincode queryinstalled > installed_cc.txt
cat installed_cc.txt

PACKAGE_ID=$(sed -n -e 's/^Package ID: //p' installed_cc.txt | sed -e 's/, Label:.*$//' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to retrieve Package ID from installed_cc.txt!"
    exit 1
fi

echo "📦 Package ID: $PACKAGE_ID"
echo "✅ Approving for CentralGovtMSP..."

export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt

peer lifecycle chaincode approveformyorg -o orderer.nevs.gov:7050 \
    --ordererTLSHostnameOverride orderer.nevs.gov \
    --tls \
    --cafile "$ORDERER_CA" \
    --channelID nevs-channel \
    --name employment \
    --version 1.0 \
    --package-id "$PACKAGE_ID" \
    --sequence 1

echo "⏳ Waiting for approval to process..."
sleep 5

echo "✅ Committing Chaincode to nevs-channel..."
peer lifecycle chaincode commit -o orderer.nevs.gov:7050 \
    --ordererTLSHostnameOverride orderer.nevs.gov \
    --tls \
    --cafile "$ORDERER_CA" \
    --channelID nevs-channel \
    --name employment \
    --version 1.0 \
    --sequence 1 \
    --peerAddresses peer0.central.govt:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt

echo "⏳ Waiting for commit to process..."
sleep 5

echo "🔍 Querying Committed Chaincode..."
peer lifecycle chaincode querycommitted -o orderer.nevs.gov:7050 \
    --channelID nevs-channel \
    --name employment \
    --cafile "$ORDERER_CA"

echo "✅ Deployment Successful!"
