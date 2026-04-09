#!/usr/bin/env bash

export MSYS_NO_PATHCONV=1
HOST_DIR=$(pwd -W | sed 's|\\|/|g')

docker run --rm --network host \
    -v "$HOST_DIR/../network/organizations:/organizations" \
    -v "$HOST_DIR/../network/configtx:/configtx" \
    -v "$HOST_DIR/../../employment.tar.gz:/tmp/../../employment.tar.gz" \
    -w /tmp \
    -e CORE_PEER_LOCALMSPID=CentralGovtMSP \
    -e CORE_PEER_MSPCONFIGPATH=/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp \
    -e CORE_PEER_ADDRESS=localhost:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/organizations/peerOrganizations/central.govt/peers/peer1.central.govt/tls/ca.crt \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.5 peer lifecycle chaincode install /tmp/../../employment.tar.gz
