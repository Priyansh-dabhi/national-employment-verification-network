#!/usr/bin/env bash

source setup-env.sh

export CORE_PEER_LOCALMSPID="CentralGovtMSP"
export CORE_PEER_MSPCONFIGPATH="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp"
export CORE_PEER_ADDRESS="localhost:7051"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt"
export FABRIC_CFG_PATH="$FABRIC_BIN/../config"

cd network
peer channel join -b channel-artifacts/nevs-channel.block
