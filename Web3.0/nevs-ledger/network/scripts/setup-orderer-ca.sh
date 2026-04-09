#!/bin/bash

# setup-orderer-ca.sh
# Automates the setup of Orderer CA, MSP, and Identities for 'nevs.gov'

export PATH="$PATH:${PWD}/../fabric-samples/bin"
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/nevs.gov

echo "🚀 Starting Orderer CA Setup for nevs.gov..."

# 1. Start CA
echo "🐳 Starting CA container..."
docker-compose -f docker/docker-compose-ca-orderer.yaml up -d

echo "⏳ Waiting for CA to start..."
sleep 5

# 2. Bootstrap CA Admin
echo "👤 Enrolling CA Admin..."
mkdir -p organizations/ordererOrganizations/nevs.gov

fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-nevs --tls.certfiles "${PWD}/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem"

# 3. Setup MSP Structure (NodeOU)
echo "⚙️ Configuring MSP NodeOUs..."
mkdir -p organizations/ordererOrganizations/nevs.gov/msp/cacerts
mkdir -p organizations/ordererOrganizations/nevs.gov/msp/tlscacerts

# Copy CA cert to MSP cacerts and tlscacerts (since using same CA for both for simplicity/standard single-CA setup)
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/nevs.gov/msp/cacerts/ca.nevs.gov-cert.pem"
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/nevs.gov/msp/tlscacerts/ca.nevs.gov-cert.pem"

# Create config.yaml
echo "NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.nevs.gov-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.nevs.gov-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.nevs.gov-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.nevs.gov-cert.pem
    OrganizationalUnitIdentifier: orderer" > organizations/ordererOrganizations/nevs.gov/msp/config.yaml

# 4. Register Identities
echo "📝 Registering Orderer Identity..."
fabric-ca-client register --caname ca-nevs --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "${PWD}/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem"

echo "📝 Registering Orderer Admin Identity..."
fabric-ca-client register --caname ca-nevs --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem"

# 5. Enroll Orderer Node MSP
echo "🔐 Enrolling Orderer Node MSP..."
mkdir -p organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov

# Temporarily switch FABRIC_CA_CLIENT_HOME for orderer node
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov

fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "${PWD}/../../ca/ca-cert.pem" --mspdir msp

# Copy config.yaml to orderer MSP
cp "${PWD}/../../msp/config.yaml" "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/msp/config.yaml"

# 6. Enroll Orderer TLS
echo "🔐 Enrolling Orderer TLS Certs..."
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "${PWD}/../../ca/ca-cert.pem" --enrollment.profile tls --mspdir tls

# Rename TLS keys for standard convenience
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.crt"
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.key"

# 7. Enroll Orderer Org Admin (for Genesis Block signing later)
echo "👤 Enrolling Orderer Org Admin..."
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/nevs.gov/users/Admin@nevs.gov
fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:8054 --caname ca-nevs --tls.certfiles "${PWD}/../../../ca/ca-cert.pem" --mspdir msp

# Copy config.yaml to Admin MSP
mkdir -p organizations/ordererOrganizations/nevs.gov/users/Admin@nevs.gov/msp
cp "${PWD}/../../../../msp/config.yaml" "${PWD}/organizations/ordererOrganizations/nevs.gov/users/Admin@nevs.gov/msp/config.yaml"

# Admincerts for Org MSP (Optional in NodeOU, but good practice for legacy compat or specific admin checks)
mkdir -p organizations/ordererOrganizations/nevs.gov/msp/admincerts
cp "${PWD}/organizations/ordererOrganizations/nevs.gov/users/Admin@nevs.gov/msp/signcerts/"* "${PWD}/organizations/ordererOrganizations/nevs.gov/msp/admincerts/admin-cert.pem"

echo "✅ Orderer CA and Identity Setup Complete!"
echo "📂 Verifying structure..."
ls -R organizations/ordererOrganizations/nevs.gov
