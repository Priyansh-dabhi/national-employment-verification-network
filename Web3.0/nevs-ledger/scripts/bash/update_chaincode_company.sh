#!/usr/bin/env bash

# update_chaincode_company.sh
# Upgrades the chaincode to sequence 2 with a dual endorsement policy.

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

echo "========== Step 0: Get Current Package ID =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode queryinstalled > installed_tmp.txt
cat installed_tmp.txt
PACKAGE_ID=$(sed -n -e 's/^Package ID: //p' installed_tmp.txt | sed -e 's/, Label:.*$//' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to retrieve Package ID from installed_tmp.txt!"
    exit 1
fi

echo "📦 Package ID: $PACKAGE_ID"

echo "========== Step 16: Install CCaaS Package on CompanyOrg Peer =========="
run_peer "$COMPANY_MSP" "$COMPANY_ADMIN" "$COMPANY_PEER" "$COMPANY_TLS" lifecycle chaincode install /tmp/../../employment.tar.gz

echo "========== Step 17: Approve Chaincode for CompanyOrgMSP =========="
# Approve as CompanyOrg admin
run_peer "$COMPANY_MSP" "$COMPANY_ADMIN" "$COMPANY_PEER" "$COMPANY_TLS" lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --package-id "$PACKAGE_ID" --sequence 2 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"

echo "========== Step 18: Re-Approve for CentralGovtMSP =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --package-id "$PACKAGE_ID" --sequence 2 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"

echo "Wait for 3 seconds..."
sleep 3

echo "========== Step 19: Check Commit Readiness =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode checkcommitreadiness \
  --channelID nevs-channel --name employment --version 1.0 --sequence 2 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"

echo "========== Step 20: Commit Updated Chaincode Definition =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode commit \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.nevs.gov --tls --cafile "$ORDERER_TLS" \
  --channelID nevs-channel --name employment --version 1.0 --sequence 2 --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$CENTRAL_TLS" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$COMPANY_TLS"

echo "Wait for 3 seconds..."
sleep 3

echo "========== Step 21: Verify Committed Definition =========="
run_peer "$CENTRAL_MSP" "$CENTRAL_ADMIN" "$CENTRAL_PEER" "$CENTRAL_TLS" lifecycle chaincode querycommitted --channelID nevs-channel --name employment

echo "Phase 3.4 Chaincode Setup Sequence Complete!"
