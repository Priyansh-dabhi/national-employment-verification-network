#!/usr/bin/env bash
source setup-env.sh
export FABRIC_CA_CLIENT_HOME="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt"
fabric-ca-client identity list --tls.certfiles "$FABRIC_CA_CLIENT_HOME/ca/ca-cert.pem" > identities.txt
