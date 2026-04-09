#!/usr/bin/env bash

# Run inside Docker where /nevs-ledger is mounted
export PROJECT_ROOT="/nevs-ledger/scripts"
cd "$PROJECT_ROOT/../network" || exit 1
mkdir -p channel-artifacts
cd channel-artifacts

export FABRIC_CFG_PATH="$PROJECT_ROOT/../network/configtx"
ORDERER_CA="$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"

# -------------------------------------------------------------
# Setup CentralGovt Admin Environment
# -------------------------------------------------------------
export CORE_PEER_LOCALMSPID="CentralGovtMSP"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
export CORE_PEER_ADDRESS=peer0.central.govt:7051

echo "========== Step 8: Fetch Current Channel Config =========="
peer channel fetch config config_block.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"

echo "========== Step 9: Decode Config to JSON =========="
configtxlator proto_decode --input config_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > config.json

echo "========== Step 10: Create Modified Config =========="
configtxgen -printOrg CompanyOrgMSP -configPath "$FABRIC_CFG_PATH" > company_org.json
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups":{"CompanyOrgMSP":.[1]}}}}}' config.json company_org.json > modified_config.json

echo "========== Step 11: Compute Config Update Delta =========="
configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
configtxlator compute_update --channel_id nevs-channel --original config.pb --updated modified_config.pb --output config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json

echo "========== Step 12: Wrap and Sign the Update =========="
echo '{"payload":{"header":{"channel_header":{"channel_id":"nevs-channel","type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_envelope.json
configtxlator proto_encode --input config_update_envelope.json --type common.Envelope --output config_update_envelope.pb

echo "========== Step 13: Submit the Config Update =========="
peer channel update -f config_update_envelope.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
sleep 5

echo "========== Step 14: Join CompanyOrg Peer to Channel =========="
export CORE_PEER_LOCALMSPID="CompanyOrgMSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/company.org/users/Admin@company.org/msp"
export CORE_PEER_ADDRESS=peer0.company.org:9051

peer channel fetch 0 nevs-channel.block -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
peer channel join -b nevs-channel.block
sleep 3

echo "========== Step 15: Set CompanyOrg Anchor Peer =========="
peer channel fetch config company_config_block.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
configtxlator proto_decode --input company_config_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > company_config.json

jq '.channel_group.groups.Application.groups.CompanyOrgMSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.company.org","port": 9051}]},"version": "0"}}' company_config.json > modified_anchor_config.json

configtxlator proto_encode --input company_config.json --type common.Config --output company_config.pb
configtxlator proto_encode --input modified_anchor_config.json --type common.Config --output modified_anchor_config.pb
configtxlator compute_update --channel_id nevs-channel --original company_config.pb --updated modified_anchor_config.pb --output anchor_update.pb
configtxlator proto_decode --input anchor_update.pb --type common.ConfigUpdate --output anchor_update.json

echo '{"payload":{"header":{"channel_header":{"channel_id":"nevs-channel","type":2}},"data":{"config_update":'$(cat anchor_update.json)'}}}' | jq . > anchor_update_envelope.json
configtxlator proto_encode --input anchor_update_envelope.json --type common.Envelope --output anchor_update_envelope.pb

peer channel update -f anchor_update_envelope.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"

echo "Phase 3.3 Channel Update Sequence Complete!"
