# fix-orderer-enrollment.ps1

$FabricSamplesBin = "$PWD\..\fabric-samples\bin"
$env:PATH += ";$FabricSamplesBin"
$RootPath = "$PWD\network"

Write-Host "🔧 Fixing Orderer Enrollment..."

$OrdererOrgPath = "$RootPath\organizations\ordererOrganizations\nevs.gov"
$OrdererNodePath = "$OrdererOrgPath\orderers\orderer.nevs.gov"
$CaCertPath = "$OrdererOrgPath\ca\ca-cert.pem"

# verify CA cert
if (-not (Test-Path $CaCertPath)) {
    Write-Error "CRITICAL: CA cert not found at $CaCertPath"
    exit 1
}

# 1. Create directory
Write-Host "📁 Creating orderer node directory..."
New-Item -ItemType Directory -Force -Path $OrdererNodePath | Out-Null

# 2. Enroll MSP
Write-Host "🔐 Enrolling MSP..."
$env:FABRIC_CA_CLIENT_HOME = $OrdererNodePath
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "$CaCertPath" --mspdir msp

# Copy config.yaml
$ConfigYamlPath = "$OrdererOrgPath\msp\config.yaml"
if (Test-Path $ConfigYamlPath) {
    Copy-Item $ConfigYamlPath "$OrdererNodePath\msp\config.yaml"
    Write-Host "✅ Copied config.yaml"
} else {
    Write-Warning "⚠️ msp/config.yaml not found to copy"
}

# 3. Enroll TLS
Write-Host "🔐 Enrolling TLS..."
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:8054 --caname ca-nevs --tls.certfiles "$CaCertPath" --enrollment.profile tls --mspdir tls

# 4. Rename TLS keys
Write-Host "🔄 Renaming TLS keys..."
$TlsPath = "$OrdererNodePath\tls"
if (Test-Path $TlsPath) {
    Copy-Item "$TlsPath\tlscacerts\*" "$TlsPath\ca.crt"
    Copy-Item "$TlsPath\signcerts\*" "$TlsPath\server.crt"
    Copy-Item "$TlsPath\keystore\*" "$TlsPath\server.key"
    Write-Host "✅ TLS keys renamed"
} else {
    Write-Error "❌ TLS directory was not created!"
}

Write-Host "✅ Orderer Enrollment Fix Complete"
Get-ChildItem -Recurse $OrdererNodePath | Select-Object FullName
