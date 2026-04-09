#!/usr/bin/env bash

source setup-env.sh

export CORE_PEER_LOCALMSPID="CentralGovtMSP"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
export CORE_PEER_ADDRESS="localhost:7051"
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
export FABRIC_CFG_PATH="$FABRIC_BIN/../config"

export FABRIC_LOGGING_SPEC=debug

cd network
peer channel create \
  -o localhost:7050 \
  -c nevs-channel \
  -f channel-artifacts/nevs-channel.tx \
  --outputBlock channel-artifacts/nevs-channel.block \
  --tls \
  --ordererTLSHostnameOverride LAPTOP-E0NPCF0N \
  --cafile "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt" > create_channel_debug.log 2>&1
