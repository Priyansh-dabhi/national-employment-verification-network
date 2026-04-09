#!/usr/bin/env bash

# update_chaincode_pdc.sh
# Upgrades the chaincode to sequence 3 with a PDC policy.

source setup-env.sh

export MSYS_NO_PATHCONV=1

PROJECT_ROOT_DIR="c:/Users/narendra/Desktop/documents/web Development Programming/AA.College-final-year-project/nevs-ledger"

# We use the fabric-tools image to run commands against our network
run_peer() {
  local ORG_MSP=$1
  local ADMIN_MSP_DIR=$2
  local PEER_ADDR=$3
  local TLS_ROOTCERT=$4
  shift 4

  docker run --rm --network host \
    -v "$PROJECT_ROOT_DIR/network/organizations:/organizations" \
    -v "$PROJECT_ROOT_DIR/network/configtx:/configtx" \
    -v "$PROJECT_ROOT_DIR/employment.tar.gz:/tmp/employment.tar.gz" \
    -v "$PROJECT_ROOT_DIR/chaincode/employment/collections_config.json:/tmp/collections_config.json" \
    -w /tmp \
    -e CORE_PEER_LOCALMSPID="$ORG_MSP" \
    -e CORE_PEER_MSPCONFIGPATH="$ADMIN_MSP_DIR" \
    -e CORE_PEER_ADDRESS="$PEER_ADDR" \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$TLS_ROOTCERT" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.5 peer "$@"
}

CENTRAL_MSP="CentralGovtMSP"
CENTRAL_ADMIN="/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
CENTRAL_PEER="localhost:7051"
CENTRAL_TLS="/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"

COMPANY_MSP="CompanyOrgMSP"
COMPANY_ADMIN="/organizations/peerOrganizations/company.org/users/Admin@company.org/msp"
COMPANY_PEER="localhost:9051"
COMPANY_TLS="/organizations/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"

ORDERER_TLS="/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"

echo "========== Step 25: Rebuild CCaaS Container =========="
cd "$PROJECT_ROOT_DIR/network/docker"
docker-compose -f docker-compose.chaincode.yaml up -d --build
cd ../../scripts/bash


echo "========== Step 0: Get Current Package ID =========="
# Packaging to make sure we have the latest payload if needed, but since it's CCaaS we might just reuse the old package
# Wait, if we rebuilt the docker image, it uses the SAME PACKAGE ID because the package ID is derived from the dummy tar.gz which has connection.json, which didn't change!
# Only the docker container code changed! Wait, NO!
# The peer checks if the sequence is incremented.

run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode queryinstalled > installed_tmp.txt
cat installed_tmp.txt
PACKAGE_ID=$(sed -n -e 's/^Package ID: //p' installed_tmp.txt | sed -e 's/, Label:.*$//' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to retrieve Package ID from installed_tmp.txt!"
    exit 1
fi

echo "📦 Package ID: $PACKAGE_ID"

echo "========== Step 26: Approve Chaincode for CompanyOrgMSP with PDC =========="
# Approve as CompanyOrg admin
run_peer "$COMPANY_MSP" "$COMPANY_ADMIN" "$COMPANY_PEER" "$COMPANY_TLS" lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --package-id "$PACKAGE_ID" --sequence 3 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /tmp/collections_config.json

echo "========== Step 26: Re-Approve for CentralGovtMSP with PDC =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --package-id "$PACKAGE_ID" --sequence 3 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /tmp/collections_config.json

echo "Wait for 3 seconds..."
sleep 3

echo "========== Step 26: Check Commit Readiness with PDC =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode checkcommitreadiness \
  --channelID nevs-channel --name employment --version 1.0 --sequence 3 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /tmp/collections_config.json

echo "========== Step 26: Commit Updated Chaincode Definition with PDC =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode commit \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --sequence 3 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /tmp/collections_config.json \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$CENTRAL_TLS" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$COMPANY_TLS"

echo "Wait for 3 seconds..."
sleep 3

echo "========== Step 26: Verify Committed Definition with PDC =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode querycommitted --channelID nevs-channel --name employment

echo "Phase 3.5 PDC Setup Sequence Complete!"
