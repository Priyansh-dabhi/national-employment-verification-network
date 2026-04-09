#!/usr/bin/env bash
# Verify CompanyOrgMSP is in the channel config

export CORE_PEER_LOCALMSPID=CentralGovtMSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/nevs-ledger/network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/nevs-ledger/network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp
export CORE_PEER_ADDRESS=peer0.central.govt:7051
ORDERER_CA=/nevs-ledger/network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt

cd /tmp
peer channel fetch config config_block.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile "$ORDERER_CA"
configtxlator proto_decode --input config_block.pb --type common.Block | jq '.data.data[0].payload.data.config.channel_group.groups.Application.groups | keys'

echo "--- Checking peer0.company.org connectivity ---"
nc -zv peer0.company.org 9051 2>&1 || echo "Connection to peer0.company.org:9051 FAILED"
