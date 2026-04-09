#!/usr/bin/env bash

source setup-env.sh

export CORE_PEER_LOCALMSPID="CentralGovtMSP"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
export CORE_PEER_ADDRESS="localhost:7051"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
export FABRIC_CFG_PATH="$FABRIC_BIN/../config"

cd network

# Generate anchor update
cd configtx
export FABRIC_CFG_PATH="$PWD"
configtxgen \
  -profile NEVSChannel \
  -outputAnchorPeersUpdate ../channel-artifacts/CentralGovtMSPanchors.tx \
  -channelID nevs-channel \
  -asOrg CentralGovtMSP

cd ..
export FABRIC_CFG_PATH="$FABRIC_BIN/../config"

# Submit update
peer channel update \
  -o localhost:7050 \
  -c nevs-channel \
  -f channel-artifacts/CentralGovtMSPanchors.tx \
  --tls \
  --ordererTLSHostnameOverride LAPTOP-E0NPCF0N \
  --cafile "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"
