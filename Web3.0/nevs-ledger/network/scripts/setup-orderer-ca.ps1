# setup-orderer-ca.ps1

$NetworkPath = "$PSScriptRoot\.."
$FabricSamplesBin = "$PSScriptRoot\..\..\fabric-samples\bin"
$env:PATH += ";$FabricSamplesBin"

Write-Host "🚀 Starting Orderer CA Setup for nevs.gov..."

# 1. Start CA (already running hopefully, but ensure)
# docker-compose -f "$NetworkPath\docker\docker-compose-ca-orderer.yaml" up -d
# Start-Sleep -Seconds 5

# 2. Bootstrap CA Admin
Write-Host "👤 Enrolling CA Admin..."
$OrdererOrgPath = "$NetworkPath\organizations\ordererOrganizations\nevs.gov"
New-Item -ItemType Directory -Force -Path $OrdererOrgPath | Out-Null

$env:FABRIC_CA_CLIENT_HOME = $OrdererOrgPath
fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-nevs --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem"

# 3. Setup MSP Structure (NodeOU)
Write-Host "⚙️ Configuring MSP NodeOUs..."
$MspPath = "$OrdererOrgPath\msp"
New-Item -ItemType Directory -Force -Path "$MspPath\cacerts" | Out-Null
New-Item -ItemType Directory -Force -Path "$MspPath\tlscacerts" | Out-Null

Copy-Item "$OrdererOrgPath\ca\ca-cert.pem" "$MspPath\cacerts\ca.nevs.gov-cert.pem"
Copy-Item "$OrdererOrgPath\ca\ca-cert.pem" "$MspPath\tlscacerts\ca.nevs.gov-cert.pem"

$ConfigYamlContent = @"
NodeOUs:
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
    OrganizationalUnitIdentifier: orderer
"@
Set-Content -Path "$MspPath\config.yaml" -Value $ConfigYamlContent

# 4. Register Identities
Write-Host "📝 Registering Orderer Identity..."
fabric-ca-client register --caname ca-nevs --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem"

Write-Host "📝 Registering Orderer Admin Identity..."
fabric-ca-client register --caname ca-nevs --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem"

# 5. Enroll Orderer Node MSP
Write-Host "🔐 Enrolling Orderer Node MSP..."
$OrdererNodePath = "$OrdererOrgPath\orderers\orderer.nevs.gov"
New-Item -ItemType Directory -Force -Path $OrdererNodePath | Out-Null

$env:FABRIC_CA_CLIENT_HOME = $OrdererNodePath
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem" --mspdir msp

Copy-Item "$MspPath\config.yaml" "$OrdererNodePath\msp\config.yaml"

# 6. Enroll Orderer TLS
Write-Host "🔐 Enrolling Orderer TLS Certs..."
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem" --enrollment.profile tls --mspdir tls

# Rename TLS keys
$TlsPath = "$OrdererNodePath\tls"
Copy-Item "$TlsPath\tlscacerts\*" "$TlsPath\ca.crt"
Copy-Item "$TlsPath\signcerts\*" "$TlsPath\server.crt"
Copy-Item "$TlsPath\keystore\*" "$TlsPath\server.key"

# 7. Enroll Orderer Org Admin
Write-Host "👤 Enrolling Orderer Org Admin..."
$AdminUserPath = "$OrdererOrgPath\users\Admin@nevs.gov"
New-Item -ItemType Directory -Force -Path $AdminUserPath | Out-Null

$env:FABRIC_CA_CLIENT_HOME = $AdminUserPath
fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:8054 --caname ca-nevs --tls.certfiles "$OrdererOrgPath\ca\ca-cert.pem" --mspdir msp

# Copy config.yaml to Admin MSP
New-Item -ItemType Directory -Force -Path "$AdminUserPath\msp" | Out-Null
Copy-Item "$MspPath\config.yaml" "$AdminUserPath\msp\config.yaml"

# Admincerts for Org MSP (Optional/Legacy check)
New-Item -ItemType Directory -Force -Path "$MspPath\admincerts" | Out-Null
Copy-Item "$AdminUserPath\msp\signcerts\*" "$MspPath\admincerts\admin-cert.pem"

Write-Host "✅ Orderer CA and Identity Setup Complete!"
Get-ChildItem -Recurse "$OrdererOrgPath" | Select-Object FullName
