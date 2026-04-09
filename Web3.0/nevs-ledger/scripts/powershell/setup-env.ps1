# setup-env.ps1
# PowerShell script to set up Fabric environment

Write-Host "🔧 Setting up Fabric environment..."

# Absolute path to fabric-samples bin (Adjust this path if necessary)
$FabricBin = "$PSScriptRoot\..\fabric-samples\bin"
$ProjectRoot = "$PSScriptRoot"

# Add Fabric binaries to PATH
if ($env:PATH -notlike "*$FabricBin*") {
    $env:PATH = "$FabricBin;$env:PATH"
    Write-Host "✅ Added Fabric binaries to PATH: $FabricBin"
} else {
    Write-Host "ℹ️  Fabric binaries already in PATH"
}

# Set Default FABRIC_CA_CLIENT_HOME
if (-not $env:FABRIC_CA_CLIENT_HOME) {
    $env:FABRIC_CA_CLIENT_HOME = "$ProjectRoot\network\organizations\peerOrganizations\central.govt"
    Write-Host "✅ Set default FABRIC_CA_CLIENT_HOME: $env:FABRIC_CA_CLIENT_HOME"
} else {
    Write-Host "ℹ️  FABRIC_CA_CLIENT_HOME already set: $env:FABRIC_CA_CLIENT_HOME"
}

Write-Host ""
Write-Host "🔍 Verifying Fabric tools..."
try {
    fabric-ca-client version
} catch {
    Write-Error "❌ fabric-ca-client not found. Please check paths."
}

Write-Host ""
Write-Host "🎯 Environment ready."
