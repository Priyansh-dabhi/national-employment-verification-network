#!/usr/bin/env bash
# restore_full_network.sh
# Run INSIDE the CLI container to restore the full multi-org network state.
# This script assumes all containers are already running.

set -e

ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"
ORDERER_ADDR="orderer.nevs.gov:7050"
CHANNEL_NAME="nevs-channel"
ORG_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations"

# Helper to set identity context
set_central_admin() {
  export CORE_PEER_LOCALMSPID="CentralGovtMSP"
  export CORE_PEER_ADDRESS="peer0.central.govt:7051"
  export CORE_PEER_TLS_ROOTCERT_FILE="$ORG_DIR/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="$ORG_DIR/peerOrganizations/central.govt/users/Admin@central.govt/msp"
}

set_central_peer1() {
  export CORE_PEER_LOCALMSPID="CentralGovtMSP"
  export CORE_PEER_ADDRESS="peer1.central.govt:8051"
  export CORE_PEER_TLS_ROOTCERT_FILE="$ORG_DIR/peerOrganizations/central.govt/peers/peer1.central.govt/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="$ORG_DIR/peerOrganizations/central.govt/users/Admin@central.govt/msp"
}

set_company_admin() {
  export CORE_PEER_LOCALMSPID="CompanyOrgMSP"
  export CORE_PEER_ADDRESS="peer0.company.org:9051"
  export CORE_PEER_TLS_ROOTCERT_FILE="$ORG_DIR/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="$ORG_DIR/peerOrganizations/company.org/users/Admin@company.org/msp"
}

echo "============================================================"
echo "  NEVS Full Network Restoration (Phase 3.1-3.6)"
echo "============================================================"

cd /tmp

# ==========================================
# STEP 1: Create Channel (if not exists)
# ==========================================
echo ""
echo "========== STEP 1: Create Channel =========="
set_central_admin

# Check if peer is already on the channel
JOINED=$(peer channel list 2>&1 | grep -c "$CHANNEL_NAME" || true)
if [ "$JOINED" -eq 0 ]; then
    peer channel create \
      -o $ORDERER_ADDR \
      -c $CHANNEL_NAME \
      -f /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/../../channel-artifacts/nevs-channel.tx \
      --outputBlock ${CHANNEL_NAME}.block \
      --tls \
      --cafile $ORDERER_CA
    echo "✅ Channel created successfully"
    
    # Join peer0.central.govt
    echo ""
    echo "========== STEP 2: Join peer0.central.govt =========="
    peer channel join -b ${CHANNEL_NAME}.block
    echo "✅ peer0.central.govt joined"
else
    echo "⏭️ peer0.central.govt already on $CHANNEL_NAME, fetching block..."
    peer channel fetch 0 ${CHANNEL_NAME}.block -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
fi

# ==========================================
# STEP 3: Join peer1.central.govt (if not already)
# ==========================================
echo ""
echo "========== STEP 3: Join peer1.central.govt =========="
set_central_peer1
JOINED1=$(peer channel list 2>&1 | grep -c "$CHANNEL_NAME" || true)
if [ "$JOINED1" -eq 0 ]; then
    peer channel join -b ${CHANNEL_NAME}.block
    echo "✅ peer1.central.govt joined"
else
    echo "⏭️ peer1.central.govt already joined"
fi

# ==========================================
# STEP 4: Set CentralGovt Anchor Peer
# ==========================================
echo ""
echo "========== STEP 4: Set CentralGovt Anchor Peer =========="
set_central_admin
peer channel fetch config anchor_config_block.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
configtxlator proto_decode --input anchor_config_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > anchor_config.json

# Check if anchor peer is already set
HAS_ANCHOR=$(jq '.channel_group.groups.Application.groups.CentralGovtMSP.values.AnchorPeers // empty' anchor_config.json)
if [ -z "$HAS_ANCHOR" ]; then
    echo "Setting CentralGovt anchor peer..."
    jq '.channel_group.groups.Application.groups.CentralGovtMSP.values += {"AnchorPeers":{"mod_policy":"Admins","value":{"anchor_peers":[{"host":"peer0.central.govt","port":7051}]},"version":"0"}}' anchor_config.json > modified_anchor_central.json

    configtxlator proto_encode --input anchor_config.json --type common.Config --output anchor_config.pb
    configtxlator proto_encode --input modified_anchor_central.json --type common.Config --output modified_anchor_central.pb
    configtxlator compute_update --channel_id $CHANNEL_NAME --original anchor_config.pb --updated modified_anchor_central.pb --output central_anchor_update.pb
    configtxlator proto_decode --input central_anchor_update.pb --type common.ConfigUpdate --output central_anchor_update.json

    echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'","type":2}},"data":{"config_update":'$(cat central_anchor_update.json)'}}}' | jq . > central_anchor_envelope.json
    configtxlator proto_encode --input central_anchor_envelope.json --type common.Envelope --output central_anchor_envelope.pb

    peer channel update -f central_anchor_envelope.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
    echo "✅ CentralGovt anchor peer set"
else
    echo "⏭️ CentralGovt anchor peer already set, skipping"
fi

sleep 2

# ==========================================
# STEP 5: Add CompanyOrgMSP to Channel
# ==========================================
echo ""
echo "========== STEP 5: Add CompanyOrgMSP to Channel Config =========="
set_central_admin
peer channel fetch config config_block.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
configtxlator proto_decode --input config_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > config.json

# Check if CompanyOrgMSP already exists
HAS_COMPANY=$(jq '.channel_group.groups.Application.groups.CompanyOrgMSP // empty' config.json)
if [ -z "$HAS_COMPANY" ]; then
    echo "Generating CompanyOrgMSP definition..."
    CONFIGTX_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/../../configtx"
    # configtx.yaml uses relative path: MSPDir: ../organizations/...
    # We need to create a symlink so that ../organizations resolves from the configtx directory
    ln -sf "$ORG_DIR" "$(cd "$CONFIGTX_DIR" && pwd)/../organizations" 2>/dev/null || true
    export FABRIC_CFG_PATH="$CONFIGTX_DIR"
    configtxgen -printOrg CompanyOrgMSP -configPath "$FABRIC_CFG_PATH" > company_org.json

    jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups":{"CompanyOrgMSP":.[1]}}}}}' config.json company_org.json > modified_config.json

    configtxlator proto_encode --input config.json --type common.Config --output config.pb
    configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
    configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_config.pb --output config_update.pb
    configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json

    echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'","type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_envelope.json
    configtxlator proto_encode --input config_update_envelope.json --type common.Envelope --output config_update_envelope.pb

    peer channel update -f config_update_envelope.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
    echo "✅ CompanyOrgMSP added to channel"
else
    echo "⏭️ CompanyOrgMSP already in channel, skipping"
fi

sleep 3

# ==========================================
# STEP 6: Join peer0.company.org + set anchor
# ==========================================
echo ""
echo "========== STEP 6: Join peer0.company.org to Channel =========="
set_company_admin

peer channel fetch 0 ${CHANNEL_NAME}_company.block -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
peer channel join -b ${CHANNEL_NAME}_company.block
echo "✅ peer0.company.org joined"

sleep 3

echo "Setting CompanyOrg anchor peer..."
peer channel fetch config company_anchor_block.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
configtxlator proto_decode --input company_anchor_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > company_config.json

HAS_COMPANY_ANCHOR=$(jq '.channel_group.groups.Application.groups.CompanyOrgMSP.values.AnchorPeers // empty' company_config.json)
if [ -z "$HAS_COMPANY_ANCHOR" ]; then
    jq '.channel_group.groups.Application.groups.CompanyOrgMSP.values += {"AnchorPeers":{"mod_policy":"Admins","value":{"anchor_peers":[{"host":"peer0.company.org","port":9051}]},"version":"0"}}' company_config.json > modified_company_anchor.json

    configtxlator proto_encode --input company_config.json --type common.Config --output company_config.pb
    configtxlator proto_encode --input modified_company_anchor.json --type common.Config --output modified_company_anchor.pb
    configtxlator compute_update --channel_id $CHANNEL_NAME --original company_config.pb --updated modified_company_anchor.pb --output company_anchor_update.pb
    configtxlator proto_decode --input company_anchor_update.pb --type common.ConfigUpdate --output company_anchor_update.json

    echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'","type":2}},"data":{"config_update":'$(cat company_anchor_update.json)'}}}' | jq . > company_anchor_envelope.json
    configtxlator proto_encode --input company_anchor_envelope.json --type common.Envelope --output company_anchor_envelope.pb

    peer channel update -f company_anchor_envelope.pb -o $ORDERER_ADDR -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
    echo "✅ CompanyOrg anchor peer set"
else
    echo "⏭️ CompanyOrg anchor peer already set, skipping"
fi

sleep 2

# ==========================================
# STEP 7: Install Chaincode on All Peers
# ==========================================
echo ""
echo "========== STEP 7: Install Chaincode on Peers =========="

# Install on peer0.central.govt
set_central_admin
echo "Installing on peer0.central.govt..."
peer lifecycle chaincode install /tmp/employment.tar.gz || echo "Already installed or error"

# Install on peer1.central.govt
set_central_peer1
echo "Installing on peer1.central.govt..."
peer lifecycle chaincode install /tmp/employment.tar.gz || echo "Already installed or error"

# Install on peer0.company.org
set_company_admin
echo "Installing on peer0.company.org..."
peer lifecycle chaincode install /tmp/employment.tar.gz || echo "Already installed or error"

# Get package ID
set_central_admin
peer lifecycle chaincode queryinstalled > installed_output.txt 2>&1
cat installed_output.txt
PACKAGE_ID=$(sed -n 's/^Package ID: //p' installed_output.txt | sed 's/, Label:.*$//' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to get Package ID!"
    exit 1
fi
echo "📦 Package ID: $PACKAGE_ID"
echo "PACKAGE_ID_MARKER=$PACKAGE_ID"

# ==========================================
# STEP 8: Approve & Commit (both orgs required since both are in channel)
# Since CompanyOrg is already in the channel, MAJORITY Endorsement
# requires both orgs. We go straight to both-org approval.
# Then we jump directly to sequence 3 (PDC).
# ==========================================
echo ""
echo "========== STEP 8: Approve Sequence 1 for BOTH Orgs =========="

# Approve as CentralGovt
set_central_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 1
echo "✅ CentralGovtMSP approved sequence 1"

# Approve as CompanyOrg
set_company_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 1
echo "✅ CompanyOrgMSP approved sequence 1"

sleep 3

# Check readiness
set_central_admin
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME --name employment --version 1.0 --sequence 1

# Commit with both peers
peer lifecycle chaincode commit \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --sequence 1 \
  --peerAddresses peer0.central.govt:7051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt" \
  --peerAddresses peer0.company.org:9051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
echo "✅ Committed sequence 1 (both orgs)"

sleep 3

# ==========================================
# STEP 9: Upgrade to Sequence 2 with Dual Endorsement Policy
# ==========================================
echo ""
echo "========== STEP 9: Sequence 2 (Dual Endorsement Policy) =========="

# Approve as CompanyOrg
set_company_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"
echo "✅ CompanyOrgMSP approved sequence 2"

# Approve as CentralGovt
set_central_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"
echo "✅ CentralGovtMSP approved sequence 2"

sleep 3

# Check readiness
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME --name employment --version 1.0 --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"

# Commit with both peers
peer lifecycle chaincode commit \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --peerAddresses peer0.central.govt:7051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt" \
  --peerAddresses peer0.company.org:9051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
echo "✅ Committed sequence 2 (dual endorsement)"

sleep 3

# ==========================================
# STEP 8c: Approve & Commit Sequence 3 (PDC)
# ==========================================
echo ""
echo "========== STEP 8c: Approve & Commit Sequence 3 (PDC) =========="

# Approve as CompanyOrg with PDC
set_company_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 3 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/employment/collections_config.json
echo "✅ CompanyOrgMSP approved sequence 3 (PDC)"

# Approve as CentralGovt with PDC
set_central_admin
peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 3 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/employment/collections_config.json
echo "✅ CentralGovtMSP approved sequence 3 (PDC)"

sleep 3

# Check readiness
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME --name employment --version 1.0 --sequence 3 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/employment/collections_config.json

# Commit with PDC
peer lifecycle chaincode commit \
  -o $ORDERER_ADDR --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name employment --version 1.0 \
  --sequence 3 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/employment/collections_config.json \
  --peerAddresses peer0.central.govt:7051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt" \
  --peerAddresses peer0.company.org:9051 \
  --tlsRootCertFiles "$ORG_DIR/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
echo "✅ Committed sequence 3 (PDC)"

sleep 2

# ==========================================
# FINAL: Verify
# ==========================================
echo ""
echo "========== FINAL VERIFICATION =========="
set_central_admin
echo "--- Channels joined by peer0.central.govt ---"
peer channel list

echo ""
echo "--- Committed chaincode ---"
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name employment

echo ""
echo "============================================================"
echo "  ✅ NEVS Network Fully Restored!"
echo "  Channel: $CHANNEL_NAME"
echo "  Chaincode: employment (Sequence 3, PDC enabled)"
echo "  Endorsement: AND(CentralGovtMSP.peer, CompanyOrgMSP.peer)"
echo "============================================================"
