#!/usr/bin/env bash
# Phase 3.3 - Steps 14 & 15 only (org already added to channel)
# Join CompanyOrg peer to channel + set anchor peer

export PROJECT_ROOT="/nevs-ledger/scripts"
ORDERER_CA="/nevs-ledger/network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"

cd /nevs-ledger/network/channel-artifacts

echo "========== Step 14: Join CompanyOrg Peer to Channel =========="
export CORE_PEER_LOCALMSPID="CompanyOrgMSP"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="/nevs-ledger/network/organizations/peerOrganizations/company.org/peers/peer0.company.org/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="/nevs-ledger/network/organizations/peerOrganizations/company.org/users/Admin@company.org/msp"
export CORE_PEER_ADDRESS=peer0.company.org:9051

echo "Fetching genesis block..."
peer channel fetch 0 nevs-channel.block -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"

echo "Joining peer to channel..."
peer channel join -b nevs-channel.block

echo "Waiting for join to process..."
sleep 3

echo "Verifying channel membership..."
peer channel list

echo "========== Step 15: Set CompanyOrg Anchor Peer =========="
peer channel fetch config company_config_block.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
configtxlator proto_decode --input company_config_block.pb --type common.Block | jq '.data.data[0].payload.data.config' > company_config.json

# Check if AnchorPeers already set
HAS_ANCHOR=$(jq '.channel_group.groups.Application.groups.CompanyOrgMSP.values.AnchorPeers // empty' company_config.json)
if [ -n "$HAS_ANCHOR" ]; then
    echo "Anchor peer already set for CompanyOrgMSP. Skipping."
else
    echo "Setting anchor peer for CompanyOrgMSP..."
    jq '.channel_group.groups.Application.groups.CompanyOrgMSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.company.org","port": 9051}]},"version": "0"}}' company_config.json > modified_anchor_config.json

    configtxlator proto_encode --input company_config.json --type common.Config --output company_config.pb
    configtxlator proto_encode --input modified_anchor_config.json --type common.Config --output modified_anchor_config.pb
    configtxlator compute_update --channel_id nevs-channel --original company_config.pb --updated modified_anchor_config.pb --output anchor_update.pb
    configtxlator proto_decode --input anchor_update.pb --type common.ConfigUpdate --output anchor_update.json

    echo '{"payload":{"header":{"channel_header":{"channel_id":"nevs-channel","type":2}},"data":{"config_update":'$(cat anchor_update.json)'}}}' | jq . > anchor_update_envelope.json
    configtxlator proto_encode --input anchor_update_envelope.json --type common.Envelope --output anchor_update_envelope.pb

    peer channel update -f anchor_update_envelope.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
    echo "Anchor peer set successfully."
fi

echo ""
echo "Phase 3.3 Steps 14 & 15 Complete!"
