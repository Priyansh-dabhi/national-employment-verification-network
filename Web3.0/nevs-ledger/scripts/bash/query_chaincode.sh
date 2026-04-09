#!/usr/bin/env bash

export MSYS_NO_PATHCONV=1
HOST_DIR=$(pwd -W | sed 's|\\|/|g')

run_peer() {
  docker run --rm --network host \
    -v "$HOST_DIR/../network/organizations:/organizations" \
    -v "$HOST_DIR/../network/configtx:/configtx" \
    -w /tmp \
    -e CORE_PEER_LOCALMSPID=CentralGovtMSP \
    -e CORE_PEER_MSPCONFIGPATH=/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp \
    -e CORE_PEER_ADDRESS=localhost:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.4 peer "$@"
}

echo "🔍 Querying GetEmploymentRecord..."
run_peer chaincode query -C nevs-channel -n employment -c '{"Args":["GetEmploymentRecord", "EMP-123", "REC-001"]}'

echo ""
echo "🔍 Querying GetEmploymentHistory..."
run_peer chaincode query -C nevs-channel -n employment -c '{"Args":["GetEmploymentHistory", "EMP-123"]}'
