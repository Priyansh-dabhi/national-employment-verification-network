#!/usr/bin/env bash

source setup-env.sh

export FABRIC_CA_CLIENT_HOME="$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov"

cd network

echo "🔐 Re-Enrolling Orderer TLS Certs with explicit SANs..."

# Remove old TLS to prevent conflicts
rm -rf organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/*

fabric-ca-client enroll \
  -u https://orderer:ordererpw@localhost:8054 \
  --caname ca-nevs \
  --tls.certfiles "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/ca/ca-cert.pem" \
  --enrollment.profile tls \
  --mspdir tls \
  --csr.hosts "orderer.nevs.gov,localhost,LAPTOP-E0NPCF0N"

echo "🔄 Re-structuring TLS files for Orderer container..."
cp "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/tlscacerts/"* "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt"
cp "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/signcerts/"* "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.crt"
cp "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/keystore/"* "$PROJECT_ROOT/../network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.key"

echo "✅ Restarting Orderer container to load new certificates..."
cd docker
docker-compose -f docker-compose-orderer.yaml restart
