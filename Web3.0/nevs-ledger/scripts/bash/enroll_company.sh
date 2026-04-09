#!/usr/bin/env bash
source setup-env.sh

ORG_DIR="$PROJECT_ROOT/../network/organizations/peerOrganizations/company.org"

# Re-create cleanly - preserving CA
rm -rf "$ORG_DIR/msp" "$ORG_DIR/users" "$ORG_DIR/peers" "$ORG_DIR/fabric-ca-client-config.yaml"
mkdir -p "$ORG_DIR/ca"

export FABRIC_CA_CLIENT_HOME="$ORG_DIR"
sleep 2

# Check if ca-cert.pem is generated
if [ ! -f "$ORG_DIR/ca/ca-cert.pem" ]; then
    echo "Wait: ca-cert.pem not found. Checking if CA container is up. Restarting CA container to regenerate..."
    docker restart ca.company.org
    sleep 3
fi

# 1. Enroll the CA Admin to the root directory
echo "Enrolling CA Admin to bootstrap..."
fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-company-org --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

echo "Registering Org Admin..."
fabric-ca-client register --caname ca-company-org --id.name companyadmin --id.secret companyadminpw --id.type admin -u https://localhost:9054 --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

echo "Enrolling Org Admin..."
fabric-ca-client enroll -u https://companyadmin:companyadminpw@localhost:9054 --caname ca-company-org -M "$ORG_DIR/users/Admin@company.org/msp" --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

# 2. Build the Org-level MSP (now populated by admin enroll) and NodeOUs
echo "Creating the Org-level MSP directory + NodeOUs..."
cat <<EOF > "$ORG_DIR/msp/config.yaml"
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-company-org.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-company-org.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-company-org.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-company-org.pem
    OrganizationalUnitIdentifier: orderer
EOF

# Copy NodeOUs to msp
cp "$ORG_DIR/msp/config.yaml" "$ORG_DIR/users/Admin@company.org/msp/config.yaml"

# 3. Register and enroll peer0.company.org
echo "Registering peer0.company.org..."
# Uses the Admin identity in FABRIC_CA_CLIENT_HOME ($ORG_DIR)
fabric-ca-client register --caname ca-company-org --id.name peer0.company.org --id.secret peer0pw --id.type peer -u https://localhost:9054 --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

echo "Enrolling peer0.company.org MSP..."
fabric-ca-client enroll -u https://peer0.company.org:peer0pw@localhost:9054 --caname ca-company-org -M "$ORG_DIR/peers/peer0.company.org/msp" --csr.hosts peer0.company.org --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

# Copy NodeOU config to peer
cp "$ORG_DIR/msp/config.yaml" "$ORG_DIR/peers/peer0.company.org/msp/config.yaml"

echo "Enrolling TLS for peer0.company.org..."
fabric-ca-client enroll -u https://peer0.company.org:peer0pw@localhost:9054 --caname ca-company-org -M "$ORG_DIR/peers/peer0.company.org/tls" --enrollment.profile tls --csr.hosts peer0.company.org --csr.hosts localhost --tls.certfiles "$ORG_DIR/ca/ca-cert.pem"

# Format the TLS artifacts for Fabric Peer
cd "$ORG_DIR/peers/peer0.company.org/tls"
cp keystore/* server.key
cp signcerts/* server.crt
cp tlscacerts/* ca.crt

echo "CompanyOrg identity bootstrapped successfully."
