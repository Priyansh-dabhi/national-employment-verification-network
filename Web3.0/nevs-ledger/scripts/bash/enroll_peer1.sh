#!/usr/bin/env bash
source setup-env.sh
ORG_DIR="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt"
export FABRIC_CA_CLIENT_HOME="$ORG_DIR"

echo "Registering peer1.central.govt..."
fabric-ca-client register --caname ca-central-govt --id.name peer1.central.govt --id.secret peer1pw --id.type peer --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

echo "Enrolling peer1.central.govt..."
fabric-ca-client enroll -u https://peer1.central.govt:peer1pw@localhost:7054 --caname ca-central-govt -M "$ORG_DIR/peers/peer1.central.govt/msp" --csr.hosts peer1.central.govt --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

cp "$ORG_DIR/msp/config.yaml" "$ORG_DIR/peers/peer1.central.govt/msp/config.yaml"

echo "Enrolling TLS for peer1.central.govt..."
fabric-ca-client enroll -u https://peer1.central.govt:peer1pw@localhost:7054 --caname ca-central-govt -M "$ORG_DIR/peers/peer1.central.govt/tls" --enrollment.profile tls --csr.hosts peer1.central.govt --csr.hosts localhost --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

cd "$ORG_DIR/peers/peer1.central.govt/tls"
cp keystore/* server.key
cp signcerts/* server.crt
cp tlscacerts/* ca.crt
echo "Peer 1 identities bootstrapped successfully."
