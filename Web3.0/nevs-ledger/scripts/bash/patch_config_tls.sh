#!/bin/bash
set -e

# Path to configtxgen config
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/configtx
ln -sf /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations /opt/gopath/src/github.com/hyperledger/fabric/organizations

# 1. Regenerate fixed Org definitions
configtxgen -printOrg CompanyOrgMSP 2>/dev/null > company_org_fixed.json
configtxgen -printOrg CentralGovtMSP 2>/dev/null > central_govt_fixed.json

# 2. Patch config.json
# Extract the TLS root certs from the newly generated org files
TLS_CERTS_COMPANY=$(jq '.values.MSP.value.config.tls_root_certs' company_org_fixed.json)
TLS_CERTS_CENTRAL=$(jq '.values.MSP.value.config.tls_root_certs' central_govt_fixed.json)

# Patch ONLY the tls_root_certs array in the existing config.json
jq --argjson certsCompany "$TLS_CERTS_COMPANY" --argjson certsCentral "$TLS_CERTS_CENTRAL" '.channel_group.groups.Application.groups.CompanyOrgMSP.values.MSP.value.config.tls_root_certs = $certsCompany | .channel_group.groups.Application.groups.CentralGovtMSP.values.MSP.value.config.tls_root_certs = $certsCentral' config.json > modified_config.json

# 3. Encode to Protobuf
configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb

# 4. Compute Delta
configtxlator compute_update --channel_id nevs-channel --original config.pb --updated modified_config.pb --output config_update.pb

# 5. Wrap in Envelope
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate > config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"nevs-channel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output config_update_in_envelope.pb

echo "✅ Config update envelope created: config_update_in_envelope.pb"
