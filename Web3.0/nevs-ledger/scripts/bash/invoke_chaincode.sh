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

echo "📝 Invoking CreateEmploymentRecord..."

run_peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.nevs.gov \
    --tls \
    --cafile /organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt \
    -C nevs-channel \
    -n employment \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles /organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt \
    -c '{"function":"CreateEmploymentRecord","Args":["REC-001", "EMP-123", "ORG-456", "Software Engineer", "2024-01-15T09:00:00Z", "ACTIVE", "2024-01-15T09:00:00Z", "2024-01-15T09:00:00Z"]}'

echo "⏳ Waiting for transaction to commit..."
sleep 3
